module sui_arena::game_platform {
    use std::string::{String, utf8};
    use std::vector;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::display;
    use sui::package;

    // === Constants ===
    const MIN_GAME_FEE: u64 = 1_000_000_000; // 1 SUI
    const REPUTATION_UPLOAD_BONUS: u64 = 10;
    const REPUTATION_PLAY_BONUS: u64 = 1;

    // === Error Codes ===
    const ENotOwner: u64 = 1;
    const EInsufficientFunds: u64 = 2;
    const EGameNotFound: u64 = 3;
    const EUnauthorized: u64 = 4;
    const EInvalidCategory: u64 = 5;

    // === Game Categories ===
    const CATEGORY_FEATURED: u8 = 0;
    const CATEGORY_ACTION: u8 = 1;
    const CATEGORY_ADVENTURE: u8 = 2;
    const CATEGORY_ARCADE: u8 = 3;
    const CATEGORY_PUZZLE: u8 = 4;
    const CATEGORY_STRATEGY: u8 = 5;
    const CATEGORY_SPORTS: u8 = 6;
    const CATEGORY_RACING: u8 = 7;
    const CATEGORY_SIMULATION: u8 = 8;
    const CATEGORY_CASINO: u8 = 9;
    const CATEGORY_PARTNER: u8 = 10;
    const CATEGORY_OTHER: u8 = 11;

    // === Structs ===

    /// Platform admin capability
    public struct AdminCap has key { id: UID }

    /// Main platform object
    public struct GamePlatform has key {
        id: UID,
        total_games: u64,
        total_users: u64,
        upload_fee: u64,
        treasury: Balance<SUI>,
        games: Table<ID, Game>,
        user_profiles: Table<address, UserProfile>,
    }

    /// Individual game object
    public struct Game has key, store {
        id: UID,
        name: String,
        description: String,
        poster_walrus_id: String, // Walrus blob ID for poster
        flash_file_walrus_id: String, // Walrus blob ID for flash file
        categories: vector<u8>,
        uploader: address,
        featured: bool,
        is_mobile_friendly: bool,
        game_type: u8, // 0 = flash, 1 = iframe
        created_at: u64,
        play_count: u64,
        rating_sum: u64,
        rating_count: u64,
    }

    /// User gaming profile
    public struct UserProfile has key, store {
        id: UID,
        user: address,
        username: String,
        reputation_score: u64,
        games_uploaded: u64,
        games_played: u64,
        total_playtime: u64,
        achievements: vector<ID>, // Achievement NFT IDs
        created_at: u64,
    }

    /// Achievement NFT
    public struct Achievement has key, store {
        id: UID,
        name: String,
        description: String,
        icon_walrus_id: String,
        owner: address,
        earned_at: u64,
        rarity: u8, // 0=Common, 1=Rare, 2=Epic, 3=Legendary
    }

    /// Gaming session tracking
    public struct GameSession has key {
        id: UID,
        player: address,
        game_id: ID,
        start_time: u64,
        duration: u64,
        score: u64,
        completed: bool,
    }

    // === Events ===

    public struct GameUploaded has copy, drop {
        game_id: ID,
        uploader: address,
        name: String,
        timestamp: u64,
    }

    public struct GamePlayed has copy, drop {
        game_id: ID,
        player: address,
        session_id: ID,
        timestamp: u64,
    }

    public struct AchievementEarned has copy, drop {
        achievement_id: ID,
        player: address,
        achievement_name: String,
        timestamp: u64,
    }

    public struct UserRegistered has copy, drop {
        user: address,
        username: String,
        timestamp: u64,
    }

    // === Initialize ===

    fun init(ctx: &mut TxContext) {
        let platform = GamePlatform {
            id: object::new(ctx),
            total_games: 0,
            total_users: 0,
            upload_fee: MIN_GAME_FEE,
            treasury: balance::zero(),
            games: table::new(ctx),
            user_profiles: table::new(ctx),
        };

        let admin_cap = AdminCap {
            id: object::new(ctx)
        };

        transfer::transfer(admin_cap, tx_context::sender(ctx));
        transfer::share_object(platform);
    }

    // === Public Functions ===

    /// Register a new user profile
    public fun register_user(
        platform: &mut GamePlatform,
        username: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        assert!(!table::contains(&platform.user_profiles, user), EUnauthorized);

        let profile = UserProfile {
            id: object::new(ctx),
            user,
            username: username,
            reputation_score: 0,
            games_uploaded: 0,
            games_played: 0,
            total_playtime: 0,
            achievements: vector::empty(),
            created_at: clock::timestamp_ms(clock),
        };

        table::add(&mut platform.user_profiles, user, profile);
        platform.total_users = platform.total_users + 1;

        event::emit(UserRegistered {
            user,
            username,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Upload a new game
    public fun upload_game(
        platform: &mut GamePlatform,
        name: String,
        description: String,
        poster_walrus_id: String,
        flash_file_walrus_id: String,
        categories: vector<u8>,
        is_mobile_friendly: bool,
        game_type: u8,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        let uploader = tx_context::sender(ctx);
        
        // Validate payment
        assert!(coin::value(&payment) >= platform.upload_fee, EInsufficientFunds);
        
        // Validate categories
        let mut i = 0;
        while (i < vector::length(&categories)) {
            let category = *vector::borrow(&categories, i);
            assert!(category <= CATEGORY_OTHER, EInvalidCategory);
            i = i + 1;
        };

        // Add payment to treasury
        let balance = coin::into_balance(payment);
        balance::join(&mut platform.treasury, balance);

        // Create game
        let game_uid = object::new(ctx);
        let game_id = object::uid_to_inner(&game_uid);
        
        let game = Game {
            id: game_uid,
            name,
            description,
            poster_walrus_id,
            flash_file_walrus_id,
            categories,
            uploader,
            featured: false,
            is_mobile_friendly,
            game_type,
            created_at: clock::timestamp_ms(clock),
            play_count: 0,
            rating_sum: 0,
            rating_count: 0,
        };

        table::add(&mut platform.games, game_id, game);
        platform.total_games = platform.total_games + 1;

        // Update user profile if exists
        if (table::contains(&platform.user_profiles, uploader)) {
            let profile = table::borrow_mut(&mut platform.user_profiles, uploader);
            profile.games_uploaded = profile.games_uploaded + 1;
            profile.reputation_score = profile.reputation_score + REPUTATION_UPLOAD_BONUS;
        };

        event::emit(GameUploaded {
            game_id,
            uploader,
            name,
            timestamp: clock::timestamp_ms(clock),
        });

        game_id
    }

    /// Start a game session
    public fun start_game_session(
        platform: &mut GamePlatform,
        game_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        let player = tx_context::sender(ctx);
        assert!(table::contains(&platform.games, game_id), EGameNotFound);

        // Update game play count
        let game = table::borrow_mut(&mut platform.games, game_id);
        game.play_count = game.play_count + 1;

        // Create game session
        let session_uid = object::new(ctx);
        let session_id = object::uid_to_inner(&session_uid);
        
        let session = GameSession {
            id: session_uid,
            player,
            game_id,
            start_time: clock::timestamp_ms(clock),
            duration: 0,
            score: 0,
            completed: false,
        };

        // Update user profile if exists
        if (table::contains(&platform.user_profiles, player)) {
            let profile = table::borrow_mut(&mut platform.user_profiles, player);
            profile.games_played = profile.games_played + 1;
            profile.reputation_score = profile.reputation_score + REPUTATION_PLAY_BONUS;
        };

        event::emit(GamePlayed {
            game_id,
            player,
            session_id,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::transfer(session, player);
        session_id
    }

    /// End a game session
    public fun end_game_session(
        platform: &mut GamePlatform,
        session: GameSession,
        score: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);
        assert!(session.player == player, EUnauthorized);

        let GameSession {
            id,
            player: _,
            game_id: _,
            start_time,
            duration: _,
            score: _,
            completed: _,
        } = session;

        let end_time = clock::timestamp_ms(clock);
        let session_duration = end_time - start_time;

        // Update user profile with playtime
        if (table::contains(&platform.user_profiles, player)) {
            let profile = table::borrow_mut(&mut platform.user_profiles, player);
            profile.total_playtime = profile.total_playtime + session_duration;
        };

        object::delete(id);

        // TODO: Check for achievements based on score/duration
        // This can be expanded based on specific achievement criteria
    }

    /// Mint achievement NFT
    public fun mint_achievement(
        platform: &mut GamePlatform,
        recipient: address,
        name: String,
        description: String,
        icon_walrus_id: String,
        rarity: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        let achievement_uid = object::new(ctx);
        let achievement_id = object::uid_to_inner(&achievement_uid);

        let achievement = Achievement {
            id: achievement_uid,
            name,
            description,
            icon_walrus_id,
            owner: recipient,
            earned_at: clock::timestamp_ms(clock),
            rarity,
        };

        // Add to user profile if exists
        if (table::contains(&platform.user_profiles, recipient)) {
            let profile = table::borrow_mut(&mut platform.user_profiles, recipient);
            vector::push_back(&mut profile.achievements, achievement_id);
            
            // Bonus reputation based on rarity
            let bonus = if (rarity == 3) 50 else if (rarity == 2) 20 else if (rarity == 1) 10 else 5;
            profile.reputation_score = profile.reputation_score + bonus;
        };

        event::emit(AchievementEarned {
            achievement_id,
            player: recipient,
            achievement_name: name,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::transfer(achievement, recipient);
        achievement_id
    }

    /// Rate a game (1-5 stars)
    public fun rate_game(
        platform: &mut GamePlatform,
        game_id: ID,
        rating: u8,
        _ctx: &mut TxContext
    ) {
        assert!(rating >= 1 && rating <= 5, EInvalidCategory);
        assert!(table::contains(&platform.games, game_id), EGameNotFound);

        let game = table::borrow_mut(&mut platform.games, game_id);
        game.rating_sum = game.rating_sum + (rating as u64);
        game.rating_count = game.rating_count + 1;
    }

    // === Admin Functions ===

    /// Feature/unfeature a game
    public fun set_game_featured(
        _: &AdminCap,
        platform: &mut GamePlatform,
        game_id: ID,
        featured: bool,
        _ctx: &mut TxContext
    ) {
        assert!(table::contains(&platform.games, game_id), EGameNotFound);
        let game = table::borrow_mut(&mut platform.games, game_id);
        game.featured = featured;
    }

    /// Update upload fee
    public fun set_upload_fee(
        _: &AdminCap,
        platform: &mut GamePlatform,
        new_fee: u64,
        _ctx: &mut TxContext
    ) {
        platform.upload_fee = new_fee;
    }

    /// Withdraw from treasury
    public fun withdraw_treasury(
        _: &AdminCap,
        platform: &mut GamePlatform,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<SUI> {
        let balance = balance::split(&mut platform.treasury, amount);
        coin::from_balance(balance, ctx)
    }

    // === View Functions ===

    public fun get_game(platform: &GamePlatform, game_id: ID): &Game {
        table::borrow(&platform.games, game_id)
    }

    public fun get_user_profile(platform: &GamePlatform, user: address): &UserProfile {
        table::borrow(&platform.user_profiles, user)
    }

    public fun get_platform_stats(platform: &GamePlatform): (u64, u64, u64) {
        (platform.total_games, platform.total_users, platform.upload_fee)
    }

    public fun game_average_rating(game: &Game): u64 {
        if (game.rating_count == 0) {
            0
        } else {
            game.rating_sum / game.rating_count
        }
    }
}