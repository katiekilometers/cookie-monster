// Privacy Policy Analysis Pipeline
// Processes raw privacy policy text and extracts structured data

class PrivacyPolicyAnalyzer {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.dataTypes = {
            'personal': ['name', 'email', 'phone', 'address', 'social security'],
            'financial': ['credit card', 'bank account', 'payment', 'billing'],
            'health': ['medical', 'health', 'fitness', 'medication'],
            'biometric': ['fingerprint', 'facial recognition', 'voice print', 'retina'],
            'location': ['GPS', 'location', 'geolocation', 'address'],
            'browsing': ['browsing history', 'search history', 'website visits'],
            'device': ['device information', 'IP address', 'user agent', 'browser']
        };
        
        this.thirdParties = {
            'advertising': ['google ads', 'facebook ads', 'amazon dsp', 'doubleclick'],
            'analytics': ['google analytics', 'adobe analytics', 'mixpanel'],
            'social': ['facebook', 'twitter', 'linkedin', 'instagram'],
            'databrokers': ['acxiom', 'experian', 'lexisnexis']
        };
        
        this.darkPatterns = {
            'preChecked': ['pre-checked', 'pre-selected', 'default consent'],
            'buried': ['necessary for', 'essential', 'required for functionality'],
            'vague': ['as needed', 'when necessary', 'reasonable period'],
            'bundled': ['accept all', 'agree to all', 'consent to all']
        };
    }

    // Main analysis function
    async analyzePolicy(policyText, domain) {
        const analysis = {
            domain,
            analyzedAt: new Date().toISOString(),
            dataCollection: await this.analyzeDataCollection(policyText),
            dataSharing: await this.analyzeDataSharing(policyText),
            dataRetention: await this.analyzeDataRetention(policyText),
            userRights: await this.analyzeUserRights(policyText),
            darkPatterns: await this.analyzeDarkPatterns(policyText),
            compliance: await this.analyzeCompliance(policyText),
            scores: {}
        };
        
        analysis.scores = this.calculateScores(analysis);
        return analysis;
    }

    // 1. Data Collection Analysis
    async analyzeDataCollection(text) {
        const collection = {
            collects_personal_info: false,
            collects_contact_info: false,
            collects_financial_info: false,
            collects_health_info: false,
            collects_biometric_info: false,
            collects_location_data: false,
            collects_device_info: false,
            collects_browsing_history: false,
            uses_tracking_pixels: false,
            uses_fingerprinting: false,
            data_used_for_ai_training: false,
            automated_decision_making: false,
            collection_purpose: []
        };

        const lowercaseText = text.toLowerCase();

        // Check for data types
        for (const [category, keywords] of Object.entries(this.dataTypes)) {
            const found = keywords.some(keyword => lowercaseText.includes(keyword));
            switch(category) {
                case 'personal':
                    collection.collects_personal_info = found;
                    break;
                case 'financial':
                    collection.collects_financial_info = found;
                    break;
                case 'health':
                    collection.collects_health_info = found;
                    break;
                case 'biometric':
                    collection.collects_biometric_info = found;
                    break;
                case 'location':
                    collection.collects_location_data = found;
                    break;
                case 'browsing':
                    collection.collects_browsing_history = found;
                    break;
                case 'device':
                    collection.collects_device_info = found;
                    break;
            }
        }

        // Check for tracking methods
        collection.uses_tracking_pixels = /pixel|beacon|web bug/i.test(text);
        collection.uses_fingerprinting = /fingerprint|device fingerprint|browser fingerprint/i.test(text);
        collection.data_used_for_ai_training = /machine learning|artificial intelligence|AI training|model training/i.test(text);
        collection.automated_decision_making = /automated decision|algorithmic decision|automated processing/i.test(text);

        // Extract purposes using LLM
        collection.collection_purpose = await this.extractWithLLM(text, 
            "List the main purposes for data collection mentioned in this privacy policy. Return as JSON array."
        );

        return collection;
    }

    // 2. Data Sharing Analysis
    async analyzeDataSharing(text) {
        const sharing = {
            shares_with_affiliates: /affiliate|subsidiary|parent company/i.test(text),
            shares_with_partners: /partner|third.{0,10}part/i.test(text),
            shares_with_advertisers: /advertis|marketing partner/i.test(text),
            sells_personal_data: /sell|sale of|monetize.*data/i.test(text),
            transfers_outside_region: /transfer.*outside|international transfer/i.test(text),
            advertising_networks: [],
            analytics_providers: [],
            social_media_platforms: [],
            opt_out_available: /opt.out|unsubscribe|withdraw consent/i.test(text)
        };

        // Identify specific third parties
        const lowercaseText = text.toLowerCase();
        for (const [category, providers] of Object.entries(this.thirdParties)) {
            const found = providers.filter(provider => lowercaseText.includes(provider));
            sharing[`${category}_networks`] = found;
        }

        // Calculate opt-out difficulty
        sharing.opt_out_difficulty_score = this.calculateOptOutDifficulty(text);

        return sharing;
    }

    // 3. Data Retention Analysis
    async analyzeDataRetention(text) {
        const retention = {
            retention_policy_clear: false,
            uses_vague_language: false,
            automatic_deletion: false,
            user_can_request_deletion: false,
            personal_data_retention_days: null,
            cookies_retention_days: null
        };

        // Extract retention periods
        const retentionMatches = text.match(/(\d+)\s*(day|month|year)s?/gi);
        if (retentionMatches) {
            retention.retention_policy_clear = true;
            // Convert to days (simplified)
            const periods = retentionMatches.map(match => {
                const [, num, unit] = match.match(/(\d+)\s*(day|month|year)/i);
                const multiplier = unit.toLowerCase().startsWith('year') ? 365 : 
                                 unit.toLowerCase().startsWith('month') ? 30 : 1;
                return parseInt(num) * multiplier;
            });
            retention.personal_data_retention_days = Math.max(...periods);
        }

        // Check for vague language
        const vagueTerms = ['as long as necessary', 'reasonable period', 'until no longer needed'];
        retention.uses_vague_language = vagueTerms.some(term => 
            text.toLowerCase().includes(term)
        );

        retention.automatic_deletion = /automatic.*delet|automatically.*remov/i.test(text);
        retention.user_can_request_deletion = /request.*delet|right.*eras|delete.*account/i.test(text);

        return retention;
    }

    // 4. User Rights Analysis
    async analyzeUserRights(text) {
        const rights = {
            right_to_access: /right.*access|access.*data/i.test(text),
            right_to_rectification: /right.*correct|rectif/i.test(text),
            right_to_erasure: /right.*eras|right.*delet|right.*forgotten/i.test(text),
            right_to_portability: /data portability|export.*data/i.test(text),
            right_to_object: /right.*object|opt.out/i.test(text),
            right_to_withdraw_consent: /withdraw.*consent|revoke.*consent/i.test(text),
            response_timeframe_days: null
        };

        // Extract response timeframes
        const timeframeMatch = text.match(/respond.*within\s*(\d+)\s*days?/i);
        if (timeframeMatch) {
            rights.response_timeframe_days = parseInt(timeframeMatch[1]);
        }

        return rights;
    }

    // 5. Dark Patterns Analysis
    async analyzeDarkPatterns(text) {
        const patterns = {
            pre_checked_boxes: false,
            accept_all_prominent: false,
            reject_all_hidden: false,
            confusing_language: false,
            wall_of_text: false,
            dark_pattern_score: 0
        };

        // Analyze text patterns
        patterns.confusing_language = this.hasConfusingLanguage(text);
        patterns.wall_of_text = text.length > 10000; // Arbitrary threshold

        // Calculate dark pattern score
        let score = 0;
        if (patterns.confusing_language) score += 20;
        if (patterns.wall_of_text) score += 15;
        // Add more scoring logic based on other patterns

        patterns.dark_pattern_score = score;
        return patterns;
    }

    // 6. Compliance Analysis
    async analyzeCompliance(text) {
        const compliance = {
            gdpr_compliance_score: 0,
            ccpa_compliance_score: 0,
            lawful_basis_specified: false,
            data_controller_identified: false,
            processing_purposes_clear: false
        };

        // GDPR compliance checks
        let gdprScore = 0;
        if (/lawful basis|legal basis/i.test(text)) {
            compliance.lawful_basis_specified = true;
            gdprScore += 20;
        }
        if (/data controller|controller/i.test(text)) {
            compliance.data_controller_identified = true;
            gdprScore += 15;
        }
        if (/purpose.*process|processing.*purpose/i.test(text)) {
            compliance.processing_purposes_clear = true;
            gdprScore += 15;
        }

        compliance.gdpr_compliance_score = gdprScore;
        return compliance;
    }

    // Scoring Algorithm
    calculateScores(analysis) {
        let privacyScore = 100; // Start with perfect score, deduct points

        // Data collection penalties
        const dataTypes = Object.values(analysis.dataCollection)
            .filter(v => typeof v === 'boolean' && v).length;
        privacyScore -= dataTypes * 5;

        // Sharing penalties
        if (analysis.dataSharing.sells_personal_data) privacyScore -= 30;
        if (analysis.dataSharing.shares_with_advertisers) privacyScore -= 20;

        // Rights bonuses
        const rightsCount = Object.values(analysis.userRights)
            .filter(v => typeof v === 'boolean' && v).length;
        privacyScore += rightsCount * 3;

        // Dark pattern penalties
        privacyScore -= analysis.darkPatterns.dark_pattern_score;

        // Ensure score is between 0-100
        privacyScore = Math.max(0, Math.min(100, privacyScore));

        return {
            privacy_score: Math.round(privacyScore),
            transparency_score: this.calculateTransparencyScore(analysis),
            user_control_score: this.calculateUserControlScore(analysis),
            data_collection_risk: this.getRiskLevel(dataTypes, 'collection'),
            sharing_risk: this.getRiskLevel(analysis.dataSharing, 'sharing')
        };
    }

    // Helper functions
    calculateOptOutDifficulty(text) {
        let difficulty = 1;
        if (/email.*request|contact.*us/i.test(text)) difficulty += 3;
        if (/verification.*require|identity.*confirm/i.test(text)) difficulty += 2;
        if (!/simple|easy|one.click/i.test(text)) difficulty += 2;
        return Math.min(10, difficulty);
    }

    hasConfusingLanguage(text) {
        const confusingPhrases = [
            'legitimate interest',
            'necessary for the performance',
            'compatible purposes',
            'reasonable commercial purposes'
        ];
        return confusingPhrases.some(phrase => 
            text.toLowerCase().includes(phrase)
        );
    }

    calculateTransparencyScore(analysis) {
        let score = 50; // Base score
        if (analysis.compliance.processing_purposes_clear) score += 20;
        if (analysis.dataRetention.retention_policy_clear) score += 15;
        if (!analysis.darkPatterns.confusing_language) score += 15;
        return Math.min(100, score);
    }

    calculateUserControlScore(analysis) {
        const rightsCount = Object.values(analysis.userRights)
            .filter(v => typeof v === 'boolean' && v).length;
        return Math.min(100, rightsCount * 12);
    }

    getRiskLevel(data, type) {
        if (type === 'collection') {
            if (data >= 8) return 'critical';
            if (data >= 5) return 'high';
            if (data >= 3) return 'medium';
            return 'low';
        }
        // Add more risk calculations
        return 'medium';
    }

    // LLM Integration (placeholder - implement with your preferred LLM API)
    async extractWithLLM(text, prompt) {
        // Implementation depends on your LLM choice (OpenAI, Anthropic, etc.)
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 500,
                    messages: [
                        {
                            role: 'user',
                            content: `${prompt}\n\nText to analyze:\n${text.substring(0, 2000)}`
                        }
                    ]
                })
            });
            
            if (!response.ok) {
                throw new Error(`Anthropic API error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.content || !Array.isArray(result.content) || !result.content[0]?.text) {
                console.warn('Unexpected Anthropic API response structure:', result);
                return [];
            }
            
            const responseText = result.content[0].text;
            
            // Try to parse as JSON, but return as array if it's not valid JSON
            try {
                const parsed = JSON.parse(responseText);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (jsonError) {
                // If not JSON, split by lines and return as array
                return responseText.split('\n').filter(line => line.trim().length > 0);
            }
        } catch (error) {
            console.error('LLM extraction failed:', error);
            return [];
        }
    }
}

// Usage Example
async function processPolicyForDatabase(domain, policyText, policyUrl) {
    const analyzer = new PrivacyPolicyAnalyzer(process.env.LLM_API_KEY);
    const analysis = await analyzer.analyzePolicy(policyText, domain);
    
    // Database insertion logic
    const dbData = {
        website: {
            domain,
            // Get industry, company size from external APIs or manual classification
        },
        policy: {
            policy_url: policyUrl,
            policy_text: policyText,
            analyzed_at: analysis.analyzedAt,
            word_count: policyText.length
        },
        analysis
    };
    
    return dbData;
}

// Export for use in your application
module.exports = { PrivacyPolicyAnalyzer, processPolicyForDatabase };