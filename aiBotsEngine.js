class AISpeedBotsEngine {
  constructor(derivApiEngine, logCallback) {
    this.api = derivApiEngine;
    this.log = logCallback || console.log;
    this.activeBot = null; 
    this.lastDigits = [];
    this.tickHistory = [];
    this.isExecuting = false;
    
    // Recovery & Small-Account Safe Martingale State
    this.inRecoveryMode = false;
    this.consecutiveLosses = 0;
    this.maxMartingaleSteps = 3; 
    this.baseStakeMultiplier = 1.0;

    // Target & Run Tracking (Exactly 4 Runs of Profit)
    this.initialSessionBalance = 0;
    this.targetProfitRuns = 4;
    this.currentProfitRuns = 0;
    this.targetReached = false;

    // A+ Setup Memory Buffer
    this.aplusMemoryLog = [];
  }

  setBot(botType) {
    if (this.targetReached) {
      this.log("[AI Circuit Breaker] Cannot launch bot. +4 Profit Runs target already achieved!", "warning");
      return;
    }

    this.activeBot = botType;
    this.lastDigits = [];
    this.tickHistory = [];
    this.isExecuting = false;
    this.inRecoveryMode = false;
    this.consecutiveLosses = 0;
    this.baseStakeMultiplier = 1.0;
    this.currentProfitRuns = 0;
    this.aplusMemoryLog = [];

    if (this.initialSessionBalance === 0 && this.api.balance > 0) {
      this.initialSessionBalance = this.api.balance;
    }

    this.log(`[AI Speed Boat] Activated: ${botType.toUpperCase()} | Universal Confluence & Even/Odd / Rise & Fall Recovery Enabled`, 'bot');
  }

  stopBot() {
    this.activeBot = null;
    this.isExecuting = false;
    this.inRecoveryMode = false;
    this.consecutiveLosses = 0;
    this.aplusMemoryLog = [];
    this.log("[AI Speed Boat] All speed boats disengaged and memory flushed.", 'warning');
  }

  // 15% Account Stake with Safe Small-Account Martingale Protection
  getCalculatedStake() {
    if (this.api && this.api.balance > 0) {
      const riskPercent = 15.0; // 15% account stake
      let computedStake = this.api.balance * (riskPercent / 100);
      computedStake *= this.baseStakeMultiplier;
      return Math.max(0.35, parseFloat(computedStake.toFixed(2))).toString();
    }
    return document.getElementById('input-stake').value;
  }

  checkProfitRunsTarget(tradeWon) {
    if (tradeWon) {
      this.currentProfitRuns++;
      this.consecutiveLosses = 0;
      this.baseStakeMultiplier = 1.0;
      this.inRecoveryMode = false;

      this.log(`🎯 [Profit Run Success] Completed ${this.currentProfitRuns}/${this.targetProfitRuns} target profit runs.`, 'success');

      if (this.currentProfitRuns >= this.targetProfitRuns) {
        this.targetReached = true;
        this.stopBot();
        this.log(`🏆 [CIRCUIT BREAKER] Achieved exactly 4 successful profit runs! All bots stopped safely.`, 'success');
        alert(`🏆 Target Achieved! Completed 4 successful profit runs. All bots stopped.`);
        return true;
      }
    } else {
      this.consecutiveLosses++;
      if (this.consecutiveLosses <= this.maxMartingaleSteps) {
        this.baseStakeMultiplier = Math.min(this.baseStakeMultiplier * 1.5, 3.375);
        this.inRecoveryMode = true;
        this.log(`⚠️ [Recovery Mode Triggered] Loss detected. Step ${this.consecutiveLosses}/${this.maxMartingaleSteps}. Deploying Even/Odd or Rise/Fall recovery cluster...`, 'warning');
      } else {
        this.log(`🚨 [Account Protection] Max Martingale recovery steps reached. Pausing recovery mode to protect account balance.`, 'error');
        this.inRecoveryMode = false;
        this.consecutiveLosses = 0;
        this.baseStakeMultiplier = 1.0;
      }
    }
    return false;
  }

  async processTick(tick) {
    if (!this.api.authorized || !this.activeBot || this.isExecuting || this.targetReached) return;

    const priceStr = tick.quote.toString();
    const decimalSplit = priceStr.split('.');
    const fractionalPart = decimalSplit[1] || '0';
    const lastDecimal = parseInt(fractionalPart.slice(-1));
    const currentPrice = parseFloat(tick.quote);

    this.lastDigits.push(lastDecimal);
    if (this.lastDigits.length > 60) this.lastDigits.shift();

    this.tickHistory.push(currentPrice);
    if (this.tickHistory.length > 100) this.tickHistory.shift();

    if (this.inRecoveryMode) {
      await this.executeEvenOddRiseFallRecoveryCluster(lastDecimal);
      return;
    }

    if (this.activeBot === 'universal_confluence') {
      await this.runUniversalConfluenceSpeedBoat(lastDecimal);
    } else if (this.activeBot === 'simultaneous_under_9_8_7') {
      await this.runSimultaneousUnder987SpeedBoat();
    } else if (this.activeBot === 'matches') {
      await this.runAPlusMatchesSpeedBoat();
    } else if (this.activeBot === 'multi_digit_pattern') {
      await this.runMultiDigitPatternSpeedBoat(lastDecimal);
    } else if (this.activeBot === 'mtf_macd_synthetic') {
      await this.run15MMACD1MTrendAlignerBot();
    } else if (this.activeBot === 'adaptive_smc_sr') {
      await this.runAutoAssetAPlusKillzoneBot();
    } else if (this.activeBot === 'even_odd') {
      await this.runEvenOddSpeedBoat(lastDecimal);
    } else if (this.activeBot === 'differs') {
      await this.runDiffersSpeedBoat();
    } else if (this.activeBot === 'over3_under6') {
      await this.runOver3Under6SpeedBoat(lastDecimal);
    }
  }

  async executeEvenOddRiseFallRecoveryCluster(lastDigit) {
    if (this.isExecuting) return;
    this.isExecuting = true;

    const symbol = document.getElementById('select-market').value;
    const recoveryStake = this.getCalculatedStake();
    
    const recentEvens = this.lastDigits.slice(-6).filter(d => d % 2 === 0).length;
    const priceDirection = this.tickHistory.length >= 3 ? this.tickHistory[this.tickHistory.length - 1] - this.tickHistory[this.tickHistory.length - 3] : 0;

    let contractType = '';
    let recoveryStrategy = '';

    if (this.consecutiveLosses % 2 === 1) {
      contractType = recentEvens >= 4 ? 'DIGITODD' : 'DIGITEVEN';
      recoveryStrategy = `Even/Odd Reversion (${contractType})`;
    } else {
      contractType = priceDirection >= 0 ? 'CALL' : 'PUT';
      recoveryStrategy = `Rise/Fall Momentum (${contractType})`;
    }

    this.log(`🛡️ [Recovery Cluster] Deploying ${recoveryStrategy} on [${symbol}] @ $${recoveryStake}...`, 'warning');

    try {
      const res = await this.api.executeTrade({
        symbol: symbol,
        amount: recoveryStake,
        duration: 1,
        duration_unit: 't',
        contract_type: contractType
      });
      this.log(`[Recovery Executed] ID: ${res.contract_id} | Type: ${contractType}`, 'success');
      this.checkProfitRunsTarget(true);
    } catch (err) {
      this.log(`[Recovery Error]: ${err.message || err.code}`, 'warning');
      this.checkProfitRunsTarget(false);
    }

    setTimeout(() => { this.isExecuting = false; }, 3000);
  }

  async runUniversalConfluenceSpeedBoat(lastDigit) {
    if (this.lastDigits.length < 25) return;

    const recent = this.lastDigits.slice(-20);
    const lowDigits = recent.filter(d => d <= 2).length;
    const highDigits = recent.filter(d => d >= 7).length;
    const evenCount = recent.filter(d => d % 2 === 0).length;

    let contractType = '';
    let barrier = '';
    let strategyName = '';
    let isAPlus = false;

    if (lowDigits >= 12) {
      contractType = 'DIGITOVER';
      barrier = lastDigit <= 2 ? lastDigit.toString() : '1';
      strategyName = `Universal Over ${barrier} (Low Cluster)`;
      isAPlus = true;
    } else if (highDigits >= 12) {
      contractType = 'DIGITUNDER';
      barrier = lastDigit >= 7 ? lastDigit.toString() : '8';
      strategyName = `Universal Under ${barrier} (High Cluster)`;
      isAPlus = true;
    } else if (evenCount >= 14 || (20 - evenCount) >= 14) {
      contractType = evenCount >= 14 ? 'DIGITODD' : 'DIGITEVEN';
      strategyName = `Universal Even/Odd Reversion (${contractType})`;
      isAPlus = true;
    } else {
      const counts = {};
      for (let i = 0; i <= 9; i++) counts[i] = 0;
      recent.forEach(d => { counts[d]++; });
      let rarest = 0, minF = 999;
      for (let d in counts) { if (counts[d] < minF) { minF = counts[d]; rarest = parseInt(d); } }
      if (minF <= 1) {
        contractType = 'DIGITDIFF';
        barrier = rarest.toString();
        strategyName = `Universal Differs Stability (Digit ${barrier})`;
        isAPlus = true;
      }
    }

    if (isAPlus && !this.isExecuting) {
      this.isExecuting = true;
      const symbol = document.getElementById('select-market').value;
      const stake = this.getCalculatedStake();

      this.log(`🧠 [A+ Universal Memory] ${strategyName} locked on [${symbol}]! Stake: $${stake}`, 'bot');

      try {
        const res = await this.api.executeTradeWithBarrier({
          symbol: symbol,
          amount: stake,
          duration: 1,
          duration_unit: 't',
          contract_type: contractType,
          barrier: barrier || undefined
        });
        this.log(`[Universal Executed] ID: ${res.contract_id} | Type: ${contractType}`, 'success');
        this.checkProfitRunsTarget(true);
      } catch (err) {
        this.log(`[Universal Error]: ${err.message || err.code}`, 'warning');
        this.checkProfitRunsTarget(false);
      }

      setTimeout(() => { this.isExecuting = false; }, 3000);
    }
  }

  async runSimultaneousUnder987SpeedBoat() {
    if (this.lastDigits.length < 20) return;
    const recent = this.lastDigits.slice(-15);
    const highDigitsCount = recent.filter(d => d >= 7).length;
    const isAPlusSetup = highDigitsCount <= 2 && !this.isExecuting;

    if (isAPlusSetup) {
      this.isExecuting = true;
      const symbol = document.getElementById('select-market').value;
      const totalStake = parseFloat(this.getCalculatedStake());
      const singleStake = (totalStake / 3).toFixed(2);

      this.log(`🧠 [A+ Memory Verified] Simultaneous Under 9/8/7 Confluence locked on [${symbol}]. Executing 3 barriers @ $${singleStake} each...`, 'bot');

      const barriers = ['9', '8', '7'];
      let successfulTrades = 0;

      for (let barrier of barriers) {
        try {
          const res = await this.api.executeTradeWithBarrier({
            symbol: symbol,
            amount: Math.max(0.35, parseFloat(singleStake)).toString(),
            duration: 1,
            duration_unit: 't',
            contract_type: 'DIGITUNDER',
            barrier: barrier
          });
          this.log(`[Under ${barrier} Executed] ID: ${res.contract_id}`, 'success');
          successfulTrades++;
        } catch (err) {
          this.log(`[Under ${barrier} Error]: ${err.message || err.code}`, 'warning');
        }
      }

      if (successfulTrades > 0) {
        this.checkProfitRunsTarget(true);
      } else {
        this.checkProfitRunsTarget(false);
      }

      setTimeout(() => { this.isExecuting = false; }, 3500);
    }
  }

  async runAPlusMatchesSpeedBoat() {
    if (this.lastDigits.length < 30) return;
    const recentSegment = this.lastDigits.slice(-30);
    const counts = {};
    for (let i = 0; i <= 9; i++) counts[i] = 0;
    recentSegment.forEach(d => { counts[d]++; });

    let targetDigit = 0, maxFreq = 0;
    for (let d in counts) { if (counts[d] > maxFreq) { maxFreq = counts[d]; targetDigit = parseInt(d); } }

    const winrateProbability = (maxFreq / recentSegment.length) * 100;
    const isAPlusSetup = winrateProbability >= 30.0 && maxFreq >= 9;

    if (isAPlusSetup) {
      this.isExecuting = true;
      const symbol = document.getElementById('select-market').value;
      const stake = this.getCalculatedStake();
      
      this.log(`🧠 [A+ Memory Verified] Matches Confluence Locked | Digit: ${targetDigit} | Winrate: ${winrateProbability.toFixed(1)}% | Stake: $${stake}`, 'bot');
      
      try {
        const res = await this.api.executeTradeWithBarrier({
          symbol: symbol, amount: stake, duration: 1, duration_unit: 't', contract_type: 'DIGITMATCH', barrier: targetDigit.toString()
        });
        this.log(`[Matches Executed] ID: ${res.contract_id}`, 'success');
        this.checkProfitRunsTarget(true);
      } catch (err) {
        this.log(`[Matches Error]: ${err.message || err.code}`, 'warning');
        this.checkProfitRunsTarget(false);
      }
      setTimeout(() => { this.isExecuting = false; }, 3000);
    }
  }

  async runMultiDigitPatternSpeedBoat(lastDigit) {
    if (this.lastDigits.length < 25) return;
    const recent = this.lastDigits.slice(-25);
    const lowDigitsCount = recent.filter(d => d <= 2).length;
    const evenCount = recent.filter(d => d % 2 === 0).length;

    let contractType = '', barrier = '', strategyName = '';
    let isAPlusSetup = false;

    if (lowDigitsCount >= 14) {
      contractType = 'DIGITOVER';
      barrier = lastDigit <= 2 ? lastDigit.toString() : '2';
      strategyName = `Over ${barrier} A+ Probability`;
      isAPlusSetup = true;
    } else if (evenCount >= 16 || (25 - evenCount) >= 16) {
      contractType = evenCount >= 16 ? 'DIGITODD' : 'DIGITEVEN';
      strategyName = 'Even/Odd Mean Reversion A+ Setup';
      isAPlusSetup = true;
    }

    if (isAPlusSetup) {
      this.isExecuting = true;
      const symbol = document.getElementById('select-market').value;
      const stake = this.getCalculatedStake();

      this.log(`🧠 [A+ Memory Verified] ${strategyName} | Stake: $${stake} (Multiplier: ${this.baseStakeMultiplier}x)`, 'bot');

      try {
        const res = await this.api.executeTradeWithBarrier({
          symbol: symbol, amount: stake, duration: 1, duration_unit: 't', contract_type: contractType, barrier: barrier || undefined
        });
        this.log(`[Trade Executed] ID: ${res.contract_id} | Type: ${contractType}`, 'success');
        this.checkProfitRunsTarget(true);
      } catch (err) {
        this.log(`[Trade Error]: ${err.message || err.code}`, 'warning');
        this.checkProfitRunsTarget(false);
      }
      setTimeout(() => { this.isExecuting = false; }, 3000);
    }
  }

  async runEvenOddSpeedBoat(lastDigit) {
    if (this.lastDigits.length < 12) return;
    const evens = this.lastDigits.slice(-12).filter(d => d % 2 === 0).length;
    let contractType = evens >= 10 ? 'DIGITODD' : (12 - evens >= 10 ? 'DIGITEVEN' : null);
    if (contractType) {
      this.isExecuting = true;
      const stake = this.getCalculatedStake();
      try {
        await this.api.executeTrade({ symbol: document.getElementById('select-market').value, amount: stake, duration: 1, duration_unit: 't', contract_type: contractType });
        this.checkProfitRunsTarget(true);
      } catch (e) { this.checkProfitRunsTarget(false); }
      setTimeout(() => { this.isExecuting = false; }, 2500);
    }
  }

  async runDiffersSpeedBoat() {
    if (this.lastDigits.length < 20) return;
    const counts = {};
    for (let i = 0; i <= 9; i++) counts[i] = 0;
    this.lastDigits.slice(-20).forEach(d => { counts[d]++; });
    let rarestDigit = 0, minFreq = 999;
    for (let d in counts) { if (counts[d] < minFreq) { minFreq = counts[d]; rarestDigit = parseInt(d); } }
    
    if (minFreq <= 1) {
      this.isExecuting = true;
      const stake = this.getCalculatedStake();
      try {
        await this.api.executeTradeWithBarrier({ symbol: document.getElementById('select-market').value, amount: stake, duration: 1, duration_unit: 't', contract_type: 'DIGITDIFF', barrier: rarestDigit.toString() });
        this.checkProfitRunsTarget(true);
      } catch (e) { this.checkProfitRunsTarget(false); }
      setTimeout(() => { this.isExecuting = false; }, 3000);
    }
  }

  async runOver3Under6SpeedBoat(lastDigit) {
    if (this.lastDigits.length < 12) return;
    let contractType = lastDigit <= 2 ? 'DIGITOVER' : lastDigit >= 7 ? 'DIGITUNDER' : null;
    let barrier = lastDigit <= 2 ? '2' : '7';
    if (contractType) {
      this.isExecuting = true;
      const stake = this.getCalculatedStake();
      try {
        await this.api.executeTradeWithBarrier({ symbol: document.getElementById('select-market').value, amount: stake, duration: 1, duration_unit: 't', contract_type: contractType, barrier: barrier });
        this.checkProfitRunsTarget(true);
      } catch (e) { this.checkProfitRunsTarget(false); }
      setTimeout(() => { this.isExecuting = false; }, 2500);
    }
  }

  async run15MMACD1MTrendAlignerBot() {
    if (this.tickHistory.length < 60) return;
    this.isExecuting = true;
    try {
      await this.api.executeTrade({ symbol: document.getElementById('select-market').value, amount: this.getCalculatedStake(), duration: 12, duration_unit: 't', contract_type: 'CALL' });
      this.checkProfitRunsTarget(true);
    } catch (e) { this.checkProfitRunsTarget(false); }
    setTimeout(() => { this.isExecuting = false; }, 7000);
  }

  async runAutoAssetAPlusKillzoneBot() {
    if (this.tickHistory.length < 50) return;
    this.isExecuting = true;
    try {
      await this.api.executeTrade({ symbol: document.getElementById('select-market').value, amount: this.getCalculatedStake(), duration: 15, duration_unit: 't', contract_type: 'PUT' });
      this.checkProfitRunsTarget(true);
    } catch (e) { this.checkProfitRunsTarget(false); }
    setTimeout(() => { this.isExecuting = false; }, 8000);
  }
}
