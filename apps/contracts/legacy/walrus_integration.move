module sui_arena::walrus_integration {
    use std::string::{String, utf8};
    use sui::event;
    use sui::url::{Self, Url};
    use sui::display;
    use sui::package;

    // === Error Codes ===
    const EInvalidBlobId: u64 = 1;
    const EBlobNotFound: u64 = 2;
    const EUnauthorized: u64 = 3;

    // === Structs ===

    /// Walrus blob metadata stored on Sui
    public struct WalrusBlob has key, store {
        id: UID,
        blob_id: String,
        content_type: String,
        size: u64,
        uploader: address,
        filename: String,
        upload_timestamp: u64,
        access_count: u64,
    }

    /// Game asset reference combining Walrus storage with Sui metadata
    public struct GameAsset has key, store {
        id: UID,
        asset_type: String, // "poster", "flash_file", "screenshot", etc.
        walrus_blob: WalrusBlob,
        game_id: Option<ID>,
        description: String,
    }

    /// NFT metadata stored on Walrus
    public struct NFTMetadata has key, store {
        id: UID,
        name: String,
        description: String,
        image_walrus_id: String,
        attributes: vector<Attribute>,
        external_url: Option<String>,
    }

    public struct Attribute has store, copy, drop {
        trait_type: String,
        value: String,
    }

    // === Events ===

    public struct BlobUploaded has copy, drop {
        blob_id: String,
        uploader: address,
        filename: String,
        content_type: String,
        size: u64,
        timestamp: u64,
    }

    public struct AssetCreated has copy, drop {
        asset_id: ID,
        asset_type: String,
        blob_id: String,
        game_id: Option<ID>,
        timestamp: u64,
    }

    // === Public Functions ===

    /// Register a blob uploaded to Walrus with metadata on Sui
    public fun register_walrus_blob(
        blob_id: String,
        content_type: String,
        size: u64,
        filename: String,
        upload_timestamp: u64,
        ctx: &mut TxContext
    ): ID {
        let uploader = tx_context::sender(ctx);
        
        let blob_uid = object::new(ctx);
        let blob_object_id = object::uid_to_inner(&blob_uid);

        let blob = WalrusBlob {
            id: blob_uid,
            blob_id,
            content_type,
            size,
            uploader,
            filename,
            upload_timestamp,
            access_count: 0,
        };

        event::emit(BlobUploaded {
            blob_id,
            uploader,
            filename,
            content_type,
            size,
            timestamp: upload_timestamp,
        });

        transfer::transfer(blob, uploader);
        blob_object_id
    }

    /// Create a game asset that references a Walrus blob
    public fun create_game_asset(
        asset_type: String,
        walrus_blob: WalrusBlob,
        game_id: Option<ID>,
        description: String,
        ctx: &mut TxContext
    ): ID {
        let asset_uid = object::new(ctx);
        let asset_id = object::uid_to_inner(&asset_uid);

        let asset = GameAsset {
            id: asset_uid,
            asset_type,
            walrus_blob,
            game_id,
            description,
        };

        event::emit(AssetCreated {
            asset_id,
            asset_type,
            blob_id: asset.walrus_blob.blob_id,
            game_id,
            timestamp: asset.walrus_blob.upload_timestamp,
        });

        transfer::transfer(asset, tx_context::sender(ctx));
        asset_id
    }

    /// Create NFT metadata that will be stored on Walrus
    public fun create_nft_metadata(
        name: String,
        description: String,
        image_walrus_id: String,
        attributes: vector<Attribute>,
        external_url: Option<String>,
        ctx: &mut TxContext
    ): NFTMetadata {
        NFTMetadata {
            id: object::new(ctx),
            name,
            description,
            image_walrus_id,
            attributes,
            external_url,
        }
    }

    /// Create an attribute for NFT metadata
    public fun create_attribute(trait_type: String, value: String): Attribute {
        Attribute { trait_type, value }
    }

    /// Increment access count for a blob (for analytics)
    public fun increment_blob_access(blob: &mut WalrusBlob) {
        blob.access_count = blob.access_count + 1;
    }

    /// Generate Walrus blob URL for frontend access
    public fun get_walrus_blob_url(blob_id: String): String {
        // Walrus aggregator URL format
        let mut url = utf8(b"https://aggregator.walrus-testnet.walrus.space/v1/");
        string::append(&mut url, blob_id);
        url
    }

    /// Generate Walrus blob download URL
    public fun get_walrus_download_url(blob_id: String): String {
        let mut url = utf8(b"https://aggregator.walrus-testnet.walrus.space/v1/");
        string::append(&mut url, blob_id);
        string::append(&mut url, utf8(b"?download=true"));
        url
    }

    // === View Functions ===

    public fun blob_info(blob: &WalrusBlob): (String, String, u64, address, u64) {
        (blob.blob_id, blob.content_type, blob.size, blob.uploader, blob.access_count)
    }

    public fun asset_info(asset: &GameAsset): (String, String, Option<ID>) {
        (asset.asset_type, asset.walrus_blob.blob_id, asset.game_id)
    }

    public fun nft_metadata_info(metadata: &NFTMetadata): (String, String, String) {
        (metadata.name, metadata.description, metadata.image_walrus_id)
    }

    // === Helper Functions ===

    /// Validate that a blob ID is properly formatted
    public fun is_valid_blob_id(blob_id: String): bool {
        // Basic validation - Walrus blob IDs are typically 44 characters (base64)
        let length = string::length(&blob_id);
        length == 44 || length == 43 // Account for potential padding variations
    }

    /// Get content type category for filtering
    public fun get_content_category(content_type: String): String {
        if (string::index_of(&content_type, &utf8(b"image/")) == 0) {
            utf8(b"image")
        } else if (string::index_of(&content_type, &utf8(b"application/x-shockwave-flash")) == 0) {
            utf8(b"flash")
        } else if (string::index_of(&content_type, &utf8(b"video/")) == 0) {
            utf8(b"video")
        } else if (string::index_of(&content_type, &utf8(b"audio/")) == 0) {
            utf8(b"audio")
        } else {
            utf8(b"other")
        }
    }
}