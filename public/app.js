const addressInput = document.getElementById('addressInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('results');
const loadingSection = document.getElementById('loading');
const errorMsg = document.getElementById('errorMsg');

// Elements to populate
const intentSummary = document.getElementById('intentSummary');
const behaviorTags = document.getElementById('behaviorTags');
const controlPattern = document.getElementById('controlPattern');
const adminPattern = document.getElementById('adminPattern');
const adminPower = document.getElementById('adminPower');
const incentiveModel = document.getElementById('incentiveModel');
const riskFlags = document.getElementById('riskFlags');
const flowList = document.getElementById('flowList');
const actorList = document.getElementById('actorList');
const chainBadge = document.getElementById('chainBadge');
const riskBadge = document.getElementById('riskBadge');

analyzeBtn.addEventListener('click', () => {
    const address = addressInput.value.trim();
    if (!address) return;

    // Reset UI
    resultsSection.classList.add('hidden');
    errorMsg.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    fetch(`/api/analyze?address=${address}&t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
            loadingSection.classList.add('hidden');

            if (data.error) {
                errorMsg.textContent = data.error;
                errorMsg.classList.remove('hidden');
                return;
            }

            renderResults(data);
            resultsSection.classList.remove('hidden');
        })
        .catch(err => {
            loadingSection.classList.add('hidden');
            errorMsg.textContent = 'Failed to reach server. Is it running?';
            errorMsg.classList.remove('hidden');
            console.error(err);
        });
});

function renderResults(data) {
    // 0. Badges
    if (data.meta.chain && data.meta.chain !== 'unknown') {
        chainBadge.textContent = data.meta.chain;
        chainBadge.classList.remove('hidden');
    } else {
        chainBadge.textContent = 'Unknown Chain';
        chainBadge.classList.add('hidden'); // Or keep visible as 'Unknown'
    }

    if (data.risks && data.risks.length > 0) {
        riskBadge.classList.remove('hidden');
        // Optional: Tooltip or text change based on risk type
    } else {
        riskBadge.classList.add('hidden');
    }

    // 1. Intent
    intentSummary.textContent = data.intent.summary;

    behaviorTags.innerHTML = '';
    data.intent.behaviorTags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        behaviorTags.appendChild(span);
    });

    // 2. Controls
    controlPattern.textContent = data.controls.upgradeability.pattern;
    adminPattern.textContent = data.controls.upgradeability.adminPattern || 'none';

    // Use engine-calculated admin power
    const power = data.controls.adminPower || 'zero';
    adminPower.textContent = power.toUpperCase();

    // Color coding for power
    if (power === 'high') adminPower.style.color = '#ff0055'; // Cyber Pink
    else if (power === 'medium') adminPower.style.color = '#ffdd00'; // Cyber Yellow
    else adminPower.style.color = '#00f2ea'; // Cyber Cyan

    // 2b. Behavior
    if (data.behavior) {
        incentiveModel.textContent = data.behavior.incentiveModel;
        riskFlags.innerHTML = '';
        data.behavior.riskFlags.forEach(flag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.style.borderColor = '#ff0055';
            span.style.color = '#ff0055';
            span.textContent = flag;
            riskFlags.appendChild(span);
        });
    } else {
        incentiveModel.textContent = 'unknown';
        riskFlags.innerHTML = '';
    }

    // 3. Flows
    flowList.innerHTML = '';
    if (data.valueFlows.length === 0) {
        flowList.innerHTML = '<p class="flow-item">No explicit value flows detected.</p>';
    } else {
        data.valueFlows.forEach(flow => {
            const div = document.createElement('div');
            div.className = 'info-row';
            const targetName = flow.targetActorId === 'contract' ? 'Contract' : (flow.targetActorId === 'user_any' ? 'User' : 'Unknown');
            const sourceName = flow.sourceActorId === 'contract' ? 'Contract' : (flow.sourceActorId === 'user_any' ? 'User' : 'Unknown');

            div.innerHTML = `
                <span>${flow.trigger}</span>
                <span class="value">${flow.asset}: ${sourceName} → ${targetName}</span>
            `;
            flowList.appendChild(div);
        });
    }

    // 4. Actors
    actorList.innerHTML = '';
    data.actors.forEach(actor => {
        const div = document.createElement('div');
        div.className = 'info-row';
        div.innerHTML = `
            <span>${actor.address.slice(0, 6)}...${actor.address.slice(-4)}</span>
            <span class="value tag" style="background: rgba(255,255,255,0.1); border:none; color:white;">${actor.type}</span>
        `;
        actorList.appendChild(div);
    });
}
