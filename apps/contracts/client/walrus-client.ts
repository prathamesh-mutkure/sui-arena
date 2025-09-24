import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";

// Walrus Configuration
const WALRUS_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_AGGREGATOR_URL =
  "https://aggregator.walrus-testnet.walrus.space/v1";

// Sui Configuration
const NETWORK = "testnet";
const PACKAGE_ID = "YOUR_PACKAGE_ID_HERE"; // Replace after deployment

export class WalrusGamePlatformClient {
  private suiClient: SuiClient;
  private keypair: Ed25519Keypair;

  constructor(privateKey?: string) {
    this.suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });
    this.keypair = privateKey
      ? Ed25519Keypair.fromSecretKey(privateKey)
      : new Ed25519Keypair();
  }

  // === Walrus Integration Functions ===

  /**
   * Upload file to Walrus and register blob on Sui
   */
  async uploadFileToWalrus(
    file: File,
    epochs: number = 5
  ): Promise<{ blobId: string; suiObjectId: string }> {
    try {
      // Upload to Walrus
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${WALRUS_PUBLISHER_URL}/v1/store?epochs=${epochs}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Walrus upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.newlyCreated) {
        const blobId = result.newlyCreated.blobObject.blobId;

        // Register blob on Sui
        const suiObjectId = await this.registerBlobOnSui({
          blobId,
          contentType: file.type,
          size: file.size,
          filename: file.name,
          uploadTimestamp: Date.now(),
        });

        return { blobId, suiObjectId };
      } else if (result.alreadyCertified) {
        // File already exists in Walrus
        const blobId = result.alreadyCertified.blobId;

        const suiObjectId = await this.registerBlobOnSui({
          blobId,
          contentType: file.type,
          size: file.size,
          filename: file.name,
          uploadTimestamp: Date.now(),
        });

        return { blobId, suiObjectId };
      } else {
        throw new Error("Unexpected Walrus response format");
      }
    } catch (error) {
      console.error("Error uploading to Walrus:", error);
      throw error;
    }
  }

  /**
   * Register Walrus blob metadata on Sui
   */
  private async registerBlobOnSui(blobData: {
    blobId: string;
    contentType: string;
    size: number;
    filename: string;
    uploadTimestamp: number;
  }): Promise<string> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::walrus_integration::register_walrus_blob`,
      arguments: [
        tx.pure(blobData.blobId),
        tx.pure(blobData.contentType),
        tx.pure(blobData.size),
        tx.pure(blobData.filename),
        tx.pure(blobData.uploadTimestamp),
      ],
    });

    const result = await this.suiClient.signAndExecuteTransactionBlock({
      signer: this.keypair,
      transactionBlock: tx,
    });

    return result.digest;
  }

  /**
   * Upload a game with assets to Walrus and create on-chain record
   */
  async uploadGame(gameData: {
    name: string;
    description: string;
    posterFile: File;
    flashFile: File;
    categories: number[];
    isMobileFriendly: boolean;
    gameType: number; // 0 = flash, 1 = iframe
    uploadFee: string; // in SUI
  }): Promise<string> {
    try {
      // Upload poster to Walrus
      const posterUpload = await this.uploadFileToWalrus(gameData.posterFile);

      // Upload flash file to Walrus
      const flashUpload = await this.uploadFileToWalrus(gameData.flashFile);

      // Create game on Sui
      const tx = new TransactionBlock();

      // Split coin for upload fee
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(gameData.uploadFee)]);

      tx.moveCall({
        target: `${PACKAGE_ID}::game_platform::upload_game`,
        arguments: [
          tx.object("PLATFORM_OBJECT_ID"), // Replace with actual platform object ID
          tx.pure(gameData.name),
          tx.pure(gameData.description),
          tx.pure(posterUpload.blobId),
          tx.pure(flashUpload.blobId),
          tx.pure(gameData.categories),
          tx.pure(gameData.isMobileFriendly),
          tx.pure(gameData.gameType),
          coin,
          tx.object("0x6"), // Clock object
        ],
      });

      const result = await this.suiClient.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: tx,
      });

      return result.digest;
    } catch (error) {
      console.error("Error uploading game:", error);
      throw error;
    }
  }

  /**
   * Start a game session
   */
  async startGameSession(gameId: string): Promise<string> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_platform::start_game_session`,
      arguments: [
        tx.object("PLATFORM_OBJECT_ID"),
        tx.pure(gameId),
        tx.object("0x6"), // Clock object
      ],
    });

    const result = await this.suiClient.signAndExecuteTransactionBlock({
      signer: this.keypair,
      transactionBlock: tx,
    });

    return result.digest;
  }

  /**
   * End a game session
   */
  async endGameSession(sessionId: string, score: number): Promise<string> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_platform::end_game_session`,
      arguments: [
        tx.object("PLATFORM_OBJECT_ID"),
        tx.object(sessionId),
        tx.pure(score),
        tx.object("0x6"), // Clock object
      ],
    });

    const result = await this.suiClient.signAndExecuteTransactionBlock({
      signer: this.keypair,
      transactionBlock: tx,
    });

    return result.digest;
  }

  /**
   * Rate a game
   */
  async rateGame(gameId: string, rating: number): Promise<string> {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_platform::rate_game`,
      arguments: [
        tx.object("PLATFORM_OBJECT_ID"),
        tx.pure(gameId),
        tx.pure(rating),
      ],
    });

    const result = await this.suiClient.signAndExecuteTransactionBlock({
      signer: this.keypair,
      transactionBlock: tx,
    });

    return result.digest;
  }

  /**
   * Mint achievement NFT
   */
  async mintAchievement(
    recipient: string,
    name: string,
    description: string,
    iconFile: File,
    rarity: number
  ): Promise<string> {
    // Upload icon to Walrus
    const iconUpload = await this.uploadFileToWalrus(iconFile);

    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::game_platform::mint_achievement`,
      arguments: [
        tx.object("PLATFORM_OBJECT_ID"),
        tx.pure(recipient),
        tx.pure(name),
        tx.pure(description),
        tx.pure(iconUpload.blobId),
        tx.pure(rarity),
        tx.object("0x6"), // Clock object
      ],
    });

    const result = await this.suiClient.signAndExecuteTransactionBlock({
      signer: this.keypair,
      transactionBlock: tx,
    });

    return result.digest;
  }

  // === Query Functions ===

  /**
   * Get game details
   */
  async getGame(gameId: string) {
    const result = await this.suiClient.getObject({
      id: gameId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (result.data?.content && "fields" in result.data.content) {
      const fields = result.data.content.fields as any;
      return {
        id: gameId,
        name: fields.name,
        description: fields.description,
        posterUrl: this.getBlobUrl(fields.poster_walrus_id),
        flashFileUrl: this.getBlobUrl(fields.flash_file_walrus_id),
        categories: fields.categories,
        uploader: fields.uploader,
        featured: fields.featured,
        isMobileFriendly: fields.is_mobile_friendly,
        gameType: fields.game_type,
        playCount: fields.play_count,
        averageRating:
          fields.rating_count > 0 ? fields.rating_sum / fields.rating_count : 0,
        createdAt: fields.created_at,
      };
    }

    throw new Error("Game not found");
  }

  /**
   * Get user profile
   */
  async getUserProfile(userAddress: string) {
    // This would require a custom indexer or dynamic field access
    // For now, we'll show the structure
    console.log("Getting user profile for:", userAddress);
    // Implementation depends on how you structure the platform object
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    // Query the platform object for stats
    const result = await this.suiClient.getObject({
      id: "PLATFORM_OBJECT_ID",
      options: {
        showContent: true,
      },
    });

    if (result.data?.content && "fields" in result.data.content) {
      const fields = result.data.content.fields as any;
      return {
        totalGames: fields.total_games,
        totalUsers: fields.total_users,
        uploadFee: fields.upload_fee,
      };
    }

    throw new Error("Platform not found");
  }
}

// === Helper Functions ===

/**
 * Game category mappings
 */
export const GAME_CATEGORIES = {
  featured: 0,
  action: 1,
  adventure: 2,
  arcade: 3,
  puzzle: 4,
  strategy: 5,
  sports: 6,
  racing: 7,
  simulation: 8,
  casino: 9,
  partner: 10,
  other: 11,
} as const;

/**
 * Achievement rarity levels
 */
export const ACHIEVEMENT_RARITY = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
} as const;

/**
 * Game types
 */
export const GAME_TYPES = {
  flash: 0,
  iframe: 1,
} as const;

// === Usage Examples ===

/*
// Initialize client
const client = new WalrusGamePlatformClient('your-private-key');

// Register user
await client.registerUser('PlayerOne');

// Upload a game
const gameResult = await client.uploadGame({
    name: 'Super Flash Game',
    description: 'An amazing flash game',
    posterFile: posterFile, // File object
    flashFile: flashFile, // File object  
    categories: [GAME_CATEGORIES.arcade, GAME_CATEGORIES.action],
    isMobileFriendly: true,
    gameType: GAME_TYPES.flash,
    uploadFee: '1000000000' // 1 SUI in MIST
});

// Start game session
await client.startGameSession(gameId);

// End session with score
await client.endGameSession(sessionId, 15000);

// Rate game
await client.rateGame(gameId, 5);

// Mint achievement
await client.mintAchievement(
    userAddress,
    'First Victory',
    'Won your first game!',
    achievementIconFile,
    ACHIEVEMENT_RARITY.common
);

        });

        if (result.objectChanges) {
            const createdObject = result.objectChanges.find(
                (change) => change.type === 'created'
            );
            if (createdObject && 'objectId' in createdObject) {
                return createdObject.objectId;
            }
        }
        
        throw new Error('Failed to get created object ID');
    }

    /**
     * Get Walrus blob content
     
    async getBlobContent(blobId: string): Promise<Blob> {
        const response = await fetch(`${WALRUS_AGGREGATOR_URL}/${blobId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }
        return response.blob();
    }

    /**
     * Get Walrus blob as URL for direct access

    getBlobUrl(blobId: string): string {
        return `${WALRUS_AGGREGATOR_URL}/${blobId}`;
    }

    // === Game Platform Functions ===

    /**
     * Register user profile

    async registerUser(username: string): Promise<string> {
        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${PACKAGE_ID}::game_platform::register_user`,
            arguments: [
                tx.object('PLATFORM_OBJECT_ID'), // Replace with actual platform object ID
                tx.pure(username),
                tx.object('0x6'), // Clock object
            ],
        });

        const result = await this.suiClient.signAndExecuteTransactionBlock({
            signer: this.keypair,
            transactionBlock: tx,
            */
