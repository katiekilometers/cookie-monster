const { JSDOM } = require('jsdom');

class PrivacyPolicyScorer {
  constructor() {
    this.scoringFactors = {
      dataCollection: { maxPoints: 20, weight: 0.20 },
      dataSharing: { maxPoints: 15, weight: 0.15 },
      userRights: { maxPoints: 15, weight: 0.15 },
      dataSecurity: { maxPoints: 10, weight: 0.10 },
      clarity: { maxPoints: 15, weight: 0.15 },
      dataRetention: { maxPoints: 10, weight: 0.10 },
      consentMechanisms: { maxPoints: 15, weight: 0.15 }
    };
  }

  // Main scoring function
  scorePrivacyPolicy(content) {
    const text = this.cleanText(content);
    const scores = {};
    const details = {};

    // Score each factor
    scores.dataCollection = this.scoreDataCollection(text, details);
    scores.dataSharing = this.scoreDataSharing(text, details);
    scores.userRights = this.scoreUserRights(text, details);
    scores.dataSecurity = this.scoreDataSecurity(text, details);
    scores.clarity = this.scoreClarity(text, details);
    scores.dataRetention = this.scoreDataRetention(text, details);
    scores.consentMechanisms = this.scoreConsentMechanisms(text, details);

    // Calculate total score
    const totalScore = Object.keys(scores).reduce((total, factor) => {
      return total + scores[factor];
    }, 0);

    // Determine letter grade
    const letterGrade = this.getLetterGrade(totalScore);

    return {
      totalScore: Math.round(totalScore),
      letterGrade,
      breakdown: scores,
      details,
      recommendations: this.generateRecommendations(scores, details)
    };
  }

  // Clean and normalize text
  cleanText(content) {
    if (typeof content === 'string') {
      return content.toLowerCase().replace(/\s+/g, ' ');
    }
    return '';
  }

  // Score Data Collection Practices (20 points)
  scoreDataCollection(text, details) {
    let score = 0;
    const indicators = {
      personalInfo: ['personal information', 'personal data', 'name', 'email', 'address', 'phone'],
      sensitiveData: ['health', 'medical', 'financial', 'credit card', 'ssn', 'social security', 'biometric'],
      locationData: ['location', 'gps', 'ip address', 'geolocation', 'precise geolocation'],
      behavioralData: ['browsing history', 'search history', 'click data', 'behavioral', 'messages', 'posts', 'likes'],
      minimalCollection: ['minimal', 'necessary', 'essential', 'required only'],
      anonymized: ['anonymized', 'anonymous', 'de-identified', 'pseudonymized'],
      extensiveCollection: ['any other data', 'everything', 'all data', 'comprehensive', 'extensive']
    };

    details.dataCollection = {
      collected: [],
      positive: [],
      negative: []
    };

    // Check what types of data are collected
    for (const [type, terms] of Object.entries(indicators)) {
      for (const term of terms) {
        if (text.includes(term)) {
          details.dataCollection.collected.push(type);
          break;
        }
      }
    }

    // Heavy penalties for extensive data collection
    if (details.dataCollection.collected.includes('extensiveCollection')) {
      score -= 8;
      details.dataCollection.negative.push('Extensive/blanket data collection');
    }

    if (details.dataCollection.collected.includes('sensitiveData')) {
      score -= 6;
      details.dataCollection.negative.push('Sensitive data collection detected');
    }

    if (details.dataCollection.collected.includes('behavioralData')) {
      score -= 4;
      details.dataCollection.negative.push('Behavioral data collection');
    }

    if (details.dataCollection.collected.includes('locationData')) {
      score -= 3;
      details.dataCollection.negative.push('Location data collection');
    }

    // Check for broad collection language
    if (text.includes('any other') || text.includes('everything') || text.includes('all data')) {
      score -= 5;
      details.dataCollection.negative.push('Broad/blanket data collection language');
    }

    // Positive factors
    if (details.dataCollection.collected.includes('minimalCollection')) {
      score += 8;
      details.dataCollection.positive.push('Minimal data collection mentioned');
    }

    if (details.dataCollection.collected.includes('anonymized')) {
      score += 6;
      details.dataCollection.positive.push('Data anonymization practices mentioned');
    }

    // Bonus for transparency about collection
    if (text.includes('collect') && text.includes('purpose')) {
      score += 3;
      details.dataCollection.positive.push('Clear purpose for data collection');
    }

    // Penalty for broad collection scope
    if (details.dataCollection.collected.length > 4) {
      score -= 4;
      details.dataCollection.negative.push('Extensive data collection detected');
    }

    return Math.max(0, Math.min(20, score + 8)); // Lower base score of 8
  }

  // Score Data Sharing and Third Parties (15 points)
  scoreDataSharing(text, details) {
    let score = 0;
    details.dataSharing = {
      thirdParties: [],
      positive: [],
      negative: []
    };

    // Check for third-party mentions
    const thirdPartyTerms = ['third party', 'third-party', 'partner', 'vendor', 'service provider', 'affiliate'];
    const sharingTerms = ['share', 'disclose', 'transfer', 'sell', 'rent'];
    const broadSharingTerms = ['any third party', 'business purposes', 'as required', 'deem necessary'];

    let hasThirdParties = false;
    thirdPartyTerms.forEach(term => {
      if (text.includes(term)) {
        hasThirdParties = true;
        details.dataSharing.thirdParties.push(term);
      }
    });

    if (hasThirdParties) {
      // Heavy penalties for broad sharing
      if (text.includes('any third party') || text.includes('business purposes')) {
        score -= 8;
        details.dataSharing.negative.push('Broad third-party sharing without restrictions');
      }

      // Check for data selling
      if (text.includes('sell') || text.includes('rent')) {
        score -= 8;
        details.dataSharing.negative.push('Data selling practices detected');
      }

      // Check for large number of partners
      const partnerCountMatch = text.match(/(\d+)\s*(?:companies?|partners?|vendors?)/);
      if (partnerCountMatch) {
        const count = parseInt(partnerCountMatch[1]);
        if (count > 20) {
          score -= 6;
          details.dataSharing.negative.push(`Sharing with ${count} partners`);
        } else if (count > 10) {
          score -= 3;
          details.dataSharing.negative.push(`Sharing with ${count} partners`);
        }
      }

      // Check if they specify which third parties
      if (text.includes('specific') || text.includes('named') || text.includes('list')) {
        score += 5;
        details.dataSharing.positive.push('Specific third parties mentioned');
      }

      // Check for consent requirements
      if (text.includes('consent') && text.includes('third party')) {
        score += 4;
        details.dataSharing.positive.push('Consent required for third-party sharing');
      }

      // Check for data minimization in sharing
      if (text.includes('minimal') && text.includes('share')) {
        score += 3;
        details.dataSharing.positive.push('Minimal data sharing practices');
      }

      // Penalty for broad sharing language
      if (text.includes('as required') || text.includes('deem necessary')) {
        score -= 4;
        details.dataSharing.negative.push('Broad sharing discretion');
      }
    } else {
      score += 8; // Bonus for no third-party sharing mentioned
      details.dataSharing.positive.push('No third-party sharing mentioned');
    }

    return Math.max(0, Math.min(15, score + 5)); // Lower base score of 5
  }

  // Score User Rights and Control (15 points)
  scoreUserRights(text, details) {
    let score = 0;
    details.userRights = {
      rights: [],
      positive: [],
      negative: []
    };

    const rights = {
      access: ['access', 'view', 'see', 'obtain'],
      modify: ['modify', 'update', 'correct', 'edit'],
      delete: ['delete', 'remove', 'erase', 'forget'],
      portability: ['portable', 'export', 'download', 'transfer'],
      optOut: ['opt out', 'opt-out', 'unsubscribe', 'withdraw']
    };

    for (const [right, terms] of Object.entries(rights)) {
      for (const term of terms) {
        if (text.includes(term)) {
          details.userRights.rights.push(right);
          break;
        }
      }
    }

    // Check for limitations on rights
    if (text.includes('may be retained') || text.includes('business reasons') || text.includes('legal reasons')) {
      score -= 4;
      details.userRights.negative.push('Limited deletion rights');
    }

    if (text.includes('up to') && text.includes('days') && text.includes('process')) {
      score -= 2;
      details.userRights.negative.push('Slow processing of requests');
    }

    if (text.includes('not easily accessible') || text.includes('difficult') || text.includes('complicated')) {
      score -= 3;
      details.userRights.negative.push('Difficult to exercise rights');
    }

    // Score based on available rights
    if (details.userRights.rights.includes('access')) {
      score += 3;
      details.userRights.positive.push('Right to access data');
    }

    if (details.userRights.rights.includes('modify')) {
      score += 3;
      details.userRights.positive.push('Right to modify data');
    }

    if (details.userRights.rights.includes('delete')) {
      score += 4;
      details.userRights.positive.push('Right to delete data');
    }

    if (details.userRights.rights.includes('portability')) {
      score += 2;
      details.userRights.positive.push('Data portability rights');
    }

    if (details.userRights.rights.includes('optOut')) {
      score += 3;
      details.userRights.positive.push('Opt-out rights');
    }

    // Check for clear process
    if (text.includes('contact') && text.includes('request')) {
      score += 2;
      details.userRights.positive.push('Clear process for exercising rights');
    }

    // Penalty for limited rights
    if (details.userRights.rights.length < 3) {
      score -= 2;
      details.userRights.negative.push('Limited user rights provided');
    }

    return Math.max(0, Math.min(15, score + 3)); // Lower base score of 3
  }

  // Score Data Security Measures (10 points)
  scoreDataSecurity(text, details) {
    let score = 0;
    details.dataSecurity = {
      measures: [],
      positive: [],
      negative: []
    };

    const securityMeasures = {
      encryption: ['encrypt', 'encryption', 'ssl', 'tls', 'secure'],
      accessControl: ['access control', 'authentication', 'authorization', 'password'],
      monitoring: ['monitor', 'audit', 'log', 'detect'],
      training: ['training', 'employee', 'staff', 'personnel'],
      incident: ['incident', 'breach', 'notification', 'response']
    };

    for (const [measure, terms] of Object.entries(securityMeasures)) {
      for (const term of terms) {
        if (text.includes(term)) {
          details.dataSecurity.measures.push(measure);
          break;
        }
      }
    }

    // Score based on security measures
    if (details.dataSecurity.measures.includes('encryption')) {
      score += 3;
      details.dataSecurity.positive.push('Encryption mentioned');
    }

    if (details.dataSecurity.measures.includes('accessControl')) {
      score += 2;
      details.dataSecurity.positive.push('Access controls mentioned');
    }

    if (details.dataSecurity.measures.includes('monitoring')) {
      score += 2;
      details.dataSecurity.positive.push('Security monitoring mentioned');
    }

    if (details.dataSecurity.measures.includes('training')) {
      score += 1;
      details.dataSecurity.positive.push('Employee training mentioned');
    }

    if (details.dataSecurity.measures.includes('incident')) {
      score += 2;
      details.dataSecurity.positive.push('Incident response plan mentioned');
    }

    // Penalty for lack of security details
    if (details.dataSecurity.measures.length === 0) {
      score -= 2;
      details.dataSecurity.negative.push('No security measures mentioned');
    }

    return Math.max(0, Math.min(10, score + 3)); // Lower base score of 3
  }

  // Score Clarity and Transparency (15 points)
  scoreClarity(text, details) {
    let score = 0;
    details.clarity = {
      positive: [],
      negative: []
    };

    // Check for clear language
    if (text.includes('clear') || text.includes('plain language') || text.includes('understandable')) {
      score += 3;
      details.clarity.positive.push('Clear language commitment');
    }

    // Check for examples
    if (text.includes('example') || text.includes('such as') || text.includes('including')) {
      score += 2;
      details.clarity.positive.push('Examples provided');
    }

    // Check for contact information
    if (text.includes('contact') && (text.includes('email') || text.includes('phone') || text.includes('address'))) {
      score += 3;
      details.clarity.positive.push('Contact information provided');
    }

    // Check for updates policy
    if (text.includes('update') && text.includes('policy')) {
      score += 2;
      details.clarity.positive.push('Policy update process mentioned');
    }

    // Check for table of contents or structure
    if (text.includes('section') || text.includes('part') || text.includes('chapter')) {
      score += 2;
      details.clarity.positive.push('Structured policy format');
    }

    // Penalty for overly complex language
    const complexTerms = ['notwithstanding', 'hereby', 'aforementioned', 'pursuant to'];
    let complexCount = 0;
    complexTerms.forEach(term => {
      if (text.includes(term)) complexCount++;
    });

    if (complexCount > 2) {
      score -= 2;
      details.clarity.negative.push('Complex legal language detected');
    }

    // Penalty for vague language
    if (text.includes('deem necessary') || text.includes('as required') || text.includes('any other')) {
      score -= 3;
      details.clarity.negative.push('Vague and broad language');
    }

    return Math.max(0, Math.min(15, score + 6)); // Lower base score of 6
  }

  // Score Data Retention and Deletion (10 points)
  scoreDataRetention(text, details) {
    let score = 0;
    details.dataRetention = {
      positive: [],
      negative: []
    };

    // Heavy penalties for indefinite retention
    if (text.includes('indefinitely') || text.includes('as long as') || text.includes('deem necessary')) {
      score -= 6;
      details.dataRetention.negative.push('Indefinite data retention');
    }

    if (text.includes('even after you delete') || text.includes('retained after deletion')) {
      score -= 4;
      details.dataRetention.negative.push('Data retained after account deletion');
    }

    // Check for retention periods
    if (text.includes('retain') || text.includes('retention') || text.includes('keep')) {
      score += 3;
      details.dataRetention.positive.push('Data retention policy mentioned');
    }

    // Check for specific timeframes
    const timeframes = ['days', 'weeks', 'months', 'years'];
    let hasTimeframes = false;
    timeframes.forEach(timeframe => {
      if (text.includes(timeframe)) hasTimeframes = true;
    });

    if (hasTimeframes) {
      score += 2;
      details.dataRetention.positive.push('Specific retention timeframes');
    }

    // Check for deletion processes
    if (text.includes('delete') && text.includes('process')) {
      score += 3;
      details.dataRetention.positive.push('Deletion process described');
    }

    // Check for automatic deletion
    if (text.includes('automatic') && text.includes('delete')) {
      score += 2;
      details.dataRetention.positive.push('Automatic deletion mentioned');
    }

    return Math.max(0, Math.min(10, score + 3)); // Lower base score of 3
  }

  // Score Consent and Opt-Out Mechanisms (15 points)
  scoreConsentMechanisms(text, details) {
    let score = 0;
    details.consentMechanisms = {
      positive: [],
      negative: []
    };

    // Heavy penalties for problematic consent practices
    if (text.includes('implied') && text.includes('consent')) {
      score -= 6;
      details.consentMechanisms.negative.push('Implied consent practices');
    }

    if (text.includes('not easily accessible') || text.includes('difficult to find')) {
      score -= 4;
      details.consentMechanisms.negative.push('Difficult opt-out mechanisms');
    }

    if (text.includes('up to') && text.includes('days') && text.includes('process')) {
      score -= 3;
      details.consentMechanisms.negative.push('Slow opt-out processing');
    }

    // Check for consent requirements
    if (text.includes('consent') && text.includes('required')) {
      score += 4;
      details.consentMechanisms.positive.push('Explicit consent required');
    }

    // Check for opt-out options
    if (text.includes('opt out') || text.includes('opt-out') || text.includes('withdraw')) {
      score += 4;
      details.consentMechanisms.positive.push('Opt-out mechanisms available');
    }

    // Check for granular consent
    if (text.includes('granular') || text.includes('specific') || text.includes('category')) {
      score += 3;
      details.consentMechanisms.positive.push('Granular consent options');
    }

    // Check for easy withdrawal
    if (text.includes('easy') && text.includes('withdraw')) {
      score += 2;
      details.consentMechanisms.positive.push('Easy consent withdrawal');
    }

    // Check for default settings
    if (text.includes('default') && text.includes('opt in')) {
      score += 2;
      details.consentMechanisms.positive.push('Opt-in default settings');
    }

    return Math.max(0, Math.min(15, score + 4)); // Lower base score of 4
  }

  // Get letter grade based on score
  getLetterGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 45) return 'D';
    if (score >= 30) return 'E';
    return 'F';
  }

  // Generate recommendations based on scores
  generateRecommendations(scores, details) {
    const recommendations = [];

    if (scores.dataCollection < 12) {
      recommendations.push('Improve data collection transparency and minimize data collection');
    }

    if (scores.dataSharing < 8) {
      recommendations.push('Provide clearer information about third-party data sharing and limit sharing scope');
    }

    if (scores.userRights < 8) {
      recommendations.push('Enhance user rights and provide clear processes for data access/modification');
    }

    if (scores.dataSecurity < 6) {
      recommendations.push('Strengthen data security measures and provide more security details');
    }

    if (scores.clarity < 8) {
      recommendations.push('Improve policy clarity and use more accessible language');
    }

    if (scores.dataRetention < 6) {
      recommendations.push('Provide clearer data retention policies and deletion processes');
    }

    if (scores.consentMechanisms < 8) {
      recommendations.push('Improve consent mechanisms and provide better opt-out options');
    }

    return recommendations;
  }
}

module.exports = PrivacyPolicyScorer; 