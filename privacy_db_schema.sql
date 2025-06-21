-- Core Tables for Privacy Policy Analytics Database

-- 1. WEBSITES - Master table of analyzed websites
CREATE TABLE websites (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    industry VARCHAR(100), -- e-commerce, social-media, news, finance, etc.
    headquarters_country VARCHAR(2), -- ISO country codes
    company_size VARCHAR(50), -- startup, small, medium, large, enterprise
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- SEO/Business Data
    alexa_rank INTEGER,
    monthly_visitors BIGINT,
    
    INDEX idx_domain (domain),
    INDEX idx_industry (industry)
);

-- 2. PRIVACY_POLICIES - Raw policy data and metadata
CREATE TABLE privacy_policies (
    id SERIAL PRIMARY KEY,
    website_id INTEGER REFERENCES websites(id),
    policy_url VARCHAR(1000),
    policy_text TEXT, -- Full policy content
    policy_html TEXT, -- Original HTML for reference
    last_updated DATE, -- When policy was last updated by company
    analyzed_at TIMESTAMP DEFAULT NOW(),
    policy_version VARCHAR(50), -- Track version changes
    language VARCHAR(10) DEFAULT 'en',
    word_count INTEGER,
    readability_score DECIMAL(4,2), -- Flesch reading ease score
    
    INDEX idx_website_analyzed (website_id, analyzed_at),
    INDEX idx_last_updated (last_updated)
);

-- 3. DATA_COLLECTION - What data is collected
CREATE TABLE data_collection (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES privacy_policies(id),
    
    -- Personal Data Types (Boolean flags)
    collects_personal_info BOOLEAN DEFAULT FALSE,
    collects_contact_info BOOLEAN DEFAULT FALSE,
    collects_financial_info BOOLEAN DEFAULT FALSE,
    collects_health_info BOOLEAN DEFAULT FALSE,
    collects_biometric_info BOOLEAN DEFAULT FALSE,
    collects_location_data BOOLEAN DEFAULT FALSE,
    collects_device_info BOOLEAN DEFAULT FALSE,
    collects_browsing_history BOOLEAN DEFAULT FALSE,
    collects_social_media BOOLEAN DEFAULT FALSE,
    collects_cookies BOOLEAN DEFAULT FALSE,
    
    -- Technical Collection Methods
    uses_tracking_pixels BOOLEAN DEFAULT FALSE,
    uses_fingerprinting BOOLEAN DEFAULT FALSE,
    uses_cross_site_tracking BOOLEAN DEFAULT FALSE,
    uses_third_party_cookies BOOLEAN DEFAULT FALSE,
    
    -- AI/ML Specific
    data_used_for_ai_training BOOLEAN DEFAULT FALSE,
    automated_decision_making BOOLEAN DEFAULT FALSE,
    profiling_activities BOOLEAN DEFAULT FALSE,
    
    -- Collection Scope
    collection_purpose TEXT[], -- Array of purposes
    collection_legal_basis VARCHAR(100), -- GDPR basis: consent, legitimate_interest, etc.
    
    INDEX idx_policy_collection (policy_id)
);

-- 4. DATA_SHARING - Third party sharing analysis
CREATE TABLE data_sharing (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES privacy_policies(id),
    
    -- Sharing Patterns
    shares_with_affiliates BOOLEAN DEFAULT FALSE,
    shares_with_partners BOOLEAN DEFAULT FALSE,
    shares_with_advertisers BOOLEAN DEFAULT FALSE,
    shares_with_data_brokers BOOLEAN DEFAULT FALSE,
    sells_personal_data BOOLEAN DEFAULT FALSE,
    
    -- Third Party Categories
    advertising_networks TEXT[], -- Array of ad networks mentioned
    analytics_providers TEXT[], -- Google Analytics, etc.
    social_media_platforms TEXT[], -- Facebook, Twitter, etc.
    
    -- International Transfers
    transfers_outside_region BOOLEAN DEFAULT FALSE,
    transfer_countries VARCHAR(1000), -- Comma separated country codes
    adequacy_decision BOOLEAN DEFAULT FALSE, -- GDPR adequacy
    transfer_safeguards VARCHAR(500), -- Standard contractual clauses, etc.
    
    -- Sharing Control
    opt_out_available BOOLEAN DEFAULT FALSE,
    opt_out_difficulty_score INTEGER, -- 1-10 scale
    
    INDEX idx_policy_sharing (policy_id)
);

-- 5. DATA_RETENTION - How long data is kept
CREATE TABLE data_retention (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES privacy_policies(id),
    
    -- Retention Periods (in days, NULL if indefinite)
    personal_data_retention_days INTEGER,
    cookies_retention_days INTEGER,
    logs_retention_days INTEGER,
    backup_retention_days INTEGER,
    
    -- Retention Clarity
    retention_policy_clear BOOLEAN DEFAULT FALSE,
    uses_vague_language BOOLEAN DEFAULT TRUE, -- "as long as necessary"
    automatic_deletion BOOLEAN DEFAULT FALSE,
    
    -- Deletion Rights
    user_can_request_deletion BOOLEAN DEFAULT FALSE,
    deletion_process_complexity INTEGER, -- 1-10 scale
    deletion_timeframe_days INTEGER, -- How long to process deletion
    deletion_exceptions TEXT[], -- What they keep even after deletion
    
    INDEX idx_policy_retention (policy_id)
);

-- 6. USER_RIGHTS - What rights users have
CREATE TABLE user_rights (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES privacy_policies(id),
    
    -- GDPR Rights
    right_to_access BOOLEAN DEFAULT FALSE,
    right_to_rectification BOOLEAN DEFAULT FALSE,
    right_to_erasure BOOLEAN DEFAULT FALSE,
    right_to_portability BOOLEAN DEFAULT FALSE,
    right_to_restrict_processing BOOLEAN DEFAULT FALSE,
    right_to_object BOOLEAN DEFAULT FALSE,
    right_to_withdraw_consent BOOLEAN DEFAULT FALSE,
    
    -- CCPA Rights
    right_to_know BOOLEAN DEFAULT FALSE,
    right_to_delete_ccpa BOOLEAN DEFAULT FALSE,
    right_to_opt_out_sale BOOLEAN DEFAULT FALSE,
    right_to_non_discrimination BOOLEAN DEFAULT FALSE,
    
    -- Implementation Details
    rights_exercise_method VARCHAR(500), -- Email, form, phone, etc.
    response_timeframe_days INTEGER,
    identity_verification_required BOOLEAN DEFAULT FALSE,
    verification_complexity INTEGER, -- 1-10 scale
    
    INDEX idx_policy_rights (policy_id)
);

-- 7. DARK_PATTERNS - Manipulative design patterns
CREATE TABLE dark_patterns (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES privacy_policies(id),
    
    -- Cookie Banner Dark Patterns
    pre_checked_boxes BOOLEAN DEFAULT FALSE,
    accept_all_prominent BOOLEAN DEFAULT FALSE,
    reject_all_hidden BOOLEAN DEFAULT FALSE,
    necessary_cookies_bundled BOOLEAN DEFAULT FALSE,
    confusing_language BOOLEAN DEFAULT FALSE,
    
    -- Policy Dark Patterns
    buried_important_info BOOLEAN DEFAULT FALSE,
    frequent_policy_changes BOOLEAN DEFAULT FALSE,
    misleading_headings BOOLEAN DEFAULT FALSE,
    wall_of_text BOOLEAN DEFAULT FALSE,
    
    -- Consent Manipulation
    implied_consent BOOLEAN DEFAULT FALSE,
    forced_consent BOOLEAN DEFAULT FALSE,
    dark_pattern_score INTEGER, -- Calculated overall score 1-100
    
    INDEX idx_policy_dark_patterns (policy_id)
);

-- 8. COMPLIANCE_ANALYSIS - Regulatory compliance scoring
CREATE TABLE compliance_analysis (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES privacy_policies(id),
    
    -- Compliance Scores (0-100)
    gdpr_compliance_score INTEGER,
    ccpa_compliance_score INTEGER,
    coppa_compliance_score INTEGER,
    
    -- Specific Compliance Checks
    lawful_basis_specified BOOLEAN DEFAULT FALSE,
    data_controller_identified BOOLEAN DEFAULT FALSE,
    dpo_contact_provided BOOLEAN DEFAULT FALSE,
    processing_purposes_clear BOOLEAN DEFAULT FALSE,
    
    -- Transparency Metrics
    policy_accessibility_score INTEGER, -- How easy to find/read
    plain_language_score INTEGER, -- Readability
    completeness_score INTEGER, -- Covers all required topics
    
    -- Red Flags
    contradictory_statements BOOLEAN DEFAULT FALSE,
    vague_commitments BOOLEAN DEFAULT FALSE,
    excessive_data_collection BOOLEAN DEFAULT FALSE,
    
    INDEX idx_policy_compliance (policy_id)
);

-- 9. ANALYTICS_SUMMARY - Pre-calculated scores for quick queries
CREATE TABLE analytics_summary (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES privacy_policies(id),
    website_id INTEGER REFERENCES websites(id),
    
    -- Overall Scores (0-100, higher = more privacy-friendly)
    privacy_score INTEGER,
    transparency_score INTEGER,
    user_control_score INTEGER,
    
    -- Risk Categories
    data_collection_risk VARCHAR(20), -- low, medium, high, critical
    sharing_risk VARCHAR(20),
    retention_risk VARCHAR(20),
    
    -- Key Metrics for Quick Analysis
    total_data_types_collected INTEGER,
    third_party_count INTEGER,
    dark_patterns_count INTEGER,
    user_rights_count INTEGER,
    
    -- Comparative Rankings
    industry_privacy_rank INTEGER,
    overall_privacy_rank INTEGER,
    
    -- Update tracking
    calculated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_website_summary (website_id),
    INDEX idx_privacy_score (privacy_score),
    INDEX idx_calculated_at (calculated_at)
);

-- 10. POLICY_CHANGES - Track changes over time
CREATE TABLE policy_changes (
    id SERIAL PRIMARY KEY,
    website_id INTEGER REFERENCES websites(id),
    old_policy_id INTEGER REFERENCES privacy_policies(id),
    new_policy_id INTEGER REFERENCES privacy_policies(id),
    change_date DATE,
    
    -- Change Analysis
    privacy_score_change INTEGER, -- Positive = more privacy-friendly
    major_changes TEXT[], -- Array of significant changes
    change_impact VARCHAR(20), -- minimal, moderate, significant, major
    user_notification_provided BOOLEAN DEFAULT FALSE,
    
    INDEX idx_website_changes (website_id, change_date),
    INDEX idx_change_impact (change_impact)
);

-- Views for Common Analytics Queries

-- Privacy Score Leaderboard by Industry
CREATE VIEW industry_privacy_rankings AS
SELECT 
    w.industry,
    w.domain,
    w.company_name,
    s.privacy_score,
    s.transparency_score,
    s.user_control_score,
    ROW_NUMBER() OVER (PARTITION BY w.industry ORDER BY s.privacy_score DESC) as industry_rank
FROM websites w
JOIN analytics_summary s ON w.id = s.website_id
ORDER BY w.industry, s.privacy_score DESC;

-- Worst Data Collection Practices
CREATE VIEW worst_data_collectors AS
SELECT 
    w.domain,
    w.industry,
    dc.collects_biometric_info,
    dc.data_used_for_ai_training,
    dc.uses_fingerprinting,
    s.privacy_score,
    s.total_data_types_collected
FROM websites w
JOIN analytics_summary s ON w.id = s.website_id
JOIN data_collection dc ON s.policy_id = dc.policy_id
WHERE s.total_data_types_collected >= 8
ORDER BY s.total_data_types_collected DESC, s.privacy_score ASC;

-- Dark Pattern Analysis
CREATE VIEW dark_pattern_offenders AS
SELECT 
    w.domain,
    w.industry,
    dp.dark_pattern_score,
    dp.pre_checked_boxes,
    dp.accept_all_prominent,
    dp.reject_all_hidden,
    s.privacy_score
FROM websites w
JOIN analytics_summary s ON w.id = s.website_id
JOIN dark_patterns dp ON s.policy_id = dp.policy_id
WHERE dp.dark_pattern_score >= 30
ORDER BY dp.dark_pattern_score DESC;