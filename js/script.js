/*
  IBS Tracker
  - Foods, Allergens, Symptoms as master lists with unique IDs
  - Diary references foodId or symptomId
  - TomSelect used for allergen tagging with create:true
*/

$(function(){
  // ---------- Initial state ----------
  let state = {
    allergens: [],      // {id, name}
    foods: [],          // {id, name, allergenIds:[]}
    symptoms: [],       // {id, name, allergenIds:[]}
    diary: [],          // {datetime, type:'food'|'symptom', foodId?, symptomId?, quantity?, severity?, frequency?}
    nextFoodId: 1,
    nextAllergenId: 1,
    nextSymptomId: 1,
    currentDate: new Date().toISOString().split('T')[0]
  };

  // Load from localStorage
  function loadState(){
    const s = localStorage.getItem('ibsTracker_v2');
    if(s) {
      state = JSON.parse(s);
    } else {
      state.allergens = [
        {id:1,  name:'Gluten (Wheat/Barley/Rye)', windowHours: 12},
        {id:2,  name:'Dairy (Lactose)', windowHours: 6},
        {id:3,  name:'FODMAP - High Fructose', windowHours: 12},
        {id:4,  name:'FODMAP - Polyols (Sorbitol, Mannitol)', windowHours: 12},
        {id:5,  name:'FODMAP - Fructans (Garlic, Onion)', windowHours: 24},
        {id:6,  name:'FODMAP - Galactans (Beans, Lentils)', windowHours: 24},
        {id:7,  name:'Soy', windowHours: 12},
        {id:8,  name:'Egg', windowHours: 8},
        {id:9,  name:'Peanut', windowHours: 4},
        {id:10, name:'Tree Nuts (Almond, Cashew, Walnut)', windowHours: 6},
        {id:11, name:'Fish', windowHours: 6},
        {id:12, name:'Shellfish (Shrimp, Crab, Lobster)', windowHours: 6},
        {id:13, name:'Sesame', windowHours: 8},
        {id:14, name:'Caffeine (Coffee, Tea, Cola)', windowHours: 3},
        {id:15, name:'Alcohol', windowHours: 4},
        {id:16, name:'Artificial Sweeteners (Aspartame, Sucralose)', windowHours: 6},
        {id:17, name:'Spicy Foods (Capsaicin)', windowHours: 3},
        {id:18, name:'Fatty / Fried Foods', windowHours: 8},
        {id:19, name:'Red Meat', windowHours: 12},
        {id:20, name:'Chocolate', windowHours: 6},
        {id:21, name:'Carbonated Drinks', windowHours: 2}
      ];
      state.nextAllergenId = 22;

      state.foods = [
        {id:1, name:'White Bread', allergenIds:[1]},
        {id:2, name:'Wholemeal Bread', allergenIds:[1]},
        {id:3, name:'Milk', allergenIds:[2]},
        {id:4, name:'Cheese', allergenIds:[2]},
        {id:5, name:'Yogurt', allergenIds:[2]},
        {id:6, name:'Beans (Kidney, Black)', allergenIds:[6]},
        {id:7, name:'Lentils', allergenIds:[6]},
        {id:8, name:'Onion', allergenIds:[5]},
        {id:9, name:'Garlic', allergenIds:[5]},
        {id:10, name:'Apple', allergenIds:[3,4]},
        {id:11, name:'Pear', allergenIds:[4]},
        {id:12, name:'Soy Milk', allergenIds:[7]},
        {id:13, name:'Eggs', allergenIds:[8]},
        {id:14, name:'Peanut Butter', allergenIds:[9]},
        {id:15, name:'Almonds', allergenIds:[10]},
        {id:16, name:'Salmon', allergenIds:[11]},
        {id:17, name:'Shrimp', allergenIds:[12]},
        {id:18, name:'Sesame Seeds', allergenIds:[13]},
        {id:19, name:'Coffee', allergenIds:[14]},
        {id:20, name:'Beer', allergenIds:[15,1]},
        {id:21, name:'Diet Cola', allergenIds:[14,16]},
        {id:22, name:'Chili Peppers', allergenIds:[17]},
        {id:23, name:'Fried Chicken', allergenIds:[18,8]},
        {id:24, name:'Steak', allergenIds:[19]},
        {id:25, name:'Chocolate Bar', allergenIds:[20]},
        {id:26, name:'Soda Water', allergenIds:[21]}
      ];
      state.nextFoodId = 27;

      state.symptoms = [
        {id:1,  name:'Bloating', allergenIds:[1,2,3,4,5,6,21]},
        {id:2,  name:'Diarrhea', allergenIds:[2,3,4,5,6,14,15,16,17]},
        {id:3,  name:'Constipation', allergenIds:[1,19]},
        {id:4,  name:'Abdominal Pain / Cramping', allergenIds:[1,2,3,4,5,6,18]},
        {id:5,  name:'Gas / Flatulence', allergenIds:[3,4,5,6,21]},
        {id:6,  name:'Nausea', allergenIds:[2,15,17,18]},
        {id:7,  name:'Acid Reflux / Heartburn', allergenIds:[14,15,18,20]},
        {id:8,  name:'Urgency (Sudden Need to Go)', allergenIds:[2,14,15]},
        {id:9,  name:'Fatigue / Brain Fog', allergenIds:[1,2,14,15]},
        {id:10, name:'Headache / Migraine', allergenIds:[2,14,15,20]}
      ];
      state.nextSymptomId = 11;

      saveState();
    }
  }
  function saveState(){ localStorage.setItem('ibsTracker_v2', JSON.stringify(state)); }

  // ---------- TomSelect instances (will initialize later) ----------
  let tsQuickFoodAllergens, tsManageFoodAllergens, tsSymptomAllergens, tsManageSymptomAllergens;

  // ---------- Helpers ----------
  function findAllergenByName(name){ return state.allergens.find(a=>a.name.toLowerCase()===name.toLowerCase()); }
  function createAllergen(name){
    const existing = findAllergenByName(name);
    if(existing) return existing.id;
    const id = state.nextAllergenId++;
    const obj = {id, name};
    state.allergens.push(obj);
    saveState();
    refreshAllergenTomSelectData();
    renderAllergensList();
    return id;
  }

  function createOrGetAllergenIdFromValue(val){
    // tom-select will return values as ids (numbers) for existing items,
    // or the created value as returned by the create callback (we wired it to create and return id).
    // We'll assume val may be string number or number.
    const n = Number(val);
    if(!isNaN(n)) return n;
    // fallback: create new allergen with name = val
    return createAllergen(val);
  }

  // ---------- UI population functions ----------
  function populateFoodSelect(){
    const sel = $('#foodSelect').empty();
    sel.append('<option value="">--Select food--</option>');
    state.foods.forEach(f=> sel.append(`<option value="${f.id}">${escapeHtml(f.name)}</option>`));
    sel.append('<option value="new">+ Add new food...</option>');
    // also populate manageFoodSelect
    const msel = $('#manageFoodSelect').empty();
    msel.append('<option value="new">+ Add new food...</option>');
    state.foods.forEach(f=> msel.append(`<option value="${f.id}">${escapeHtml(f.name)}</option>`));
    renderFoodsList();
  }

  function populateSymptomSelect(){
    const sel = $('#symptomSelect').empty();
    sel.append('<option value="">--Select symptom (or add below)--</option>');
    state.symptoms.forEach(s=> sel.append(`<option value="${s.id}">${escapeHtml(s.name)}</option>`));
    $('#manageSymptomSelect').empty().append('<option value="new">+ Add new symptom...</option>');
    state.symptoms.forEach(s=> $('#manageSymptomSelect').append(`<option value="${s.id}">${escapeHtml(s.name)}</option>`));
    renderSymptomsList();
  }

  function refreshAllergenTomSelectData(){
    // convert allergens to TomSelect options {value:id, text:name}
    const options = state.allergens.map(a=> ({value: String(a.id), text: a.name}));
    // update TomSelect instances options
    [tsQuickFoodAllergens, tsManageFoodAllergens, tsSymptomAllergens, tsManageSymptomAllergens].forEach(ts=>{
      if(!ts) return;
      ts.clearOptions();
      options.forEach(o=> ts.addOption(o));
      ts.refreshOptions(false);
    });
  }

  // ---------- Render lists for management modals ----------
  function renderFoodsList(){
    const el = $('#foodsList').empty();
    state.foods.forEach(f=>{
      const allergenNames = f.allergenIds.map(id=> (state.allergens.find(a=>a.id===id)||{name:'(unknown)'}).name ).join(', ');
      const item = $(`<div class="list-group-item d-flex justify-content-between align-items-start">
        <div>
          <div class="fw-semibold">${escapeHtml(f.name)}</div>
          <div class="small-muted">${escapeHtml(allergenNames)}</div>
        </div>
        <div class="text-muted small">#${f.id}</div>
      </div>`);
      el.append(item);
    });
  }

  function renderAllergensList(){
    const el = $('#allergensList').empty();
    state.allergens.forEach(a=>{
      // count usage
      const usedInFoods = state.foods.filter(f=>f.allergenIds.includes(a.id)).length;
      const usedInSymptoms = state.symptoms.filter(s=>s.allergenIds.includes(a.id)).length;
      const item = $(`
        <div class="list-group-item d-flex justify-content-between align-items-center">
          <div>${escapeHtml(a.name)}</div>
          <div class="d-flex gap-2 align-items-center">
            <div class="small text-muted">foods ${usedInFoods} • symptoms ${usedInSymptoms}</div>
            <button class="btn btn-sm btn-outline-danger remove-allergen-btn" data-id="${a.id}">Delete</button>
          </div>
        </div>`);
      el.append(item);
    });
  }

  function renderSymptomsList(){
    const el = $('#symptomsList').empty();
    state.symptoms.forEach(s=>{
      const allergenNames = s.allergenIds.map(id=> (state.allergens.find(a=>a.id===id)||{name:'(unknown)'}).name ).join(', ');
      const item = $(`<div class="list-group-item d-flex justify-content-between align-items-start">
        <div>
          <div class="fw-semibold">${escapeHtml(s.name)}</div>
          <div class="small-muted">${escapeHtml(allergenNames)}</div>
        </div>
        <div class="text-muted small">#${s.id}</div>
      </div>`);
      el.append(item);
    });
  }

  // ---------- Diary render ----------
  function renderDiary() {
    $('#currentDate').text(state.currentDate);
    $('#diaryGrid').empty();

    for (let h = 0; h < 24; h++) {
      const hourStr = h.toString().padStart(2, '0') + ':00';
      const row = $(`
        <div class="hour-slot row align-items-start">
          <div class="col-2 fw-bold">${hourStr}</div>
          <div class="col-7 entries"></div>
          <div class="col-3 text-end">
            <button class="btn btn-sm btn-warning addFoodBtn">Add Food</button>
            <button class="btn btn-sm btn-danger addSymptomBtn">Add Symptom</button>
          </div>
        </div>`);

      // find entries for this hour
      const entries = state.diary.filter(d =>
        d.datetime.startsWith(state.currentDate) &&
        new Date(d.datetime).getHours() === h
      );

      entries.forEach((e) => {
        let text = '';
        if (e.type === 'food') {
          const f = state.foods.find(ff => ff.id === e.foodId);
          text = f ? `${f.name}${e.quantity ? (' • ' + e.quantity) : ''}` : `Unknown food • ${e.quantity || ''}`;
        } else if (e.type === 'symptom') {
          const s = state.symptoms.find(ss => ss.id === e.symptomId);
          text = s ? `${s.name} • severity ${e.severity}` : `Unknown symptom • severity ${e.severity}`;
        }

        const div = $(`
          <div class="entry ${e.type === 'food' ? 'food-entry' : 'symptom-entry'} d-flex justify-content-between align-items-center" style="cursor:pointer;">
            <span>${escapeHtml(text)}</span>
            <button class="btn btn-sm btn-outline-danger btn-delete" style="display:none;padding: 2px;line-height: 1em;">&times;</button>
          </div>
        `);

        // click to edit
        div.on('click', function (evt) {
          if ($(evt.target).hasClass('btn-delete')) return; // skip if delete clicked

          if (e.type === 'food') {
            // ensure select options exist
            populateFoodSelect();

            $('#foodModal .modal-title').text('Edit Food Entry');
            // set select (as string) and trigger change so quick-new logic runs
            $('#foodSelect').val(String(e.foodId)).trigger('change');

            // hide quick new unless user selected "new"
            if ($('#foodSelect').val() === 'new') {
              $('#quickNewFood').removeClass('d-none');
            } else {
              $('#quickNewFood').addClass('d-none');
            }

            $('#quickFoodName').val(''); // only used if 'new' selected
            $('#foodQty').val(e.quantity || '');

            // set time input to entry's actual hh:mm
            const dt = new Date(e.datetime);
            const hh = String(dt.getHours()).padStart(2,'0');
            const mm = String(dt.getMinutes()).padStart(2,'0');
            $('#foodTime').val(`${hh}:${mm}`);

            $('#foodModalSave').data('editIndex', state.diary.indexOf(e));
            $('#foodModal').modal('show');

          } else if (e.type === 'symptom') {
            // ensure symptom select populated
            populateSymptomSelect();

            $('#symptomModal .modal-title').text('Edit Symptom Entry');
            $('#symptomSelect').val(String(e.symptomId)).trigger('change');
            $('#quickSymptomName').val('');
            $('#symptomSeverity').val(e.severity || 5);
            $('#symptomFrequency').val(e.frequency || 'once');

            const dt = new Date(e.datetime);
            const hh = String(dt.getHours()).padStart(2,'0');
            const mm = String(dt.getMinutes()).padStart(2,'0');
            $('#symptomTime').val(`${hh}:${mm}`);

            // if you use tsSymptomAllergens for the quick-new-symptom tags you could populate them here if needed

            $('#symptomModalSave').data('editIndex', state.diary.indexOf(e));
            $('#symptomModal').modal('show');
          }
        });

        // hover to show delete button
        div.hover(
          () => div.find('.btn-delete').show(),
          () => div.find('.btn-delete').hide()
        );

        // delete handler
        div.find('.btn-delete').on('click', (ev) => {
          ev.stopPropagation();
          if (confirm('Delete this entry?')) {
            const idxInDiary = state.diary.indexOf(e);
            if (idxInDiary > -1) {
              state.diary.splice(idxInDiary, 1);
              saveState();
              renderDiary();
            }
          }
        });

        row.find('.entries').append(div);
      });

      // bind add buttons
      row.find('.addFoodBtn').off('click').on('click', () => {
        // Reset to Add mode
        $('#foodModal .modal-title').text('Add Food (Diary)');
        $('#foodTime').val(hourStr);
        // ensure food options available
        populateFoodSelect();
        $('#foodSelect').val('').trigger('change');
        $('#quickNewFood').addClass('d-none');
        $('#quickFoodName').val('');
        $('#foodQty').val('');
        if (tsQuickFoodAllergens) tsQuickFoodAllergens.clear();
        $('#foodModalSave').removeData('editIndex');
        $('#foodModal').modal('show');
      });

      row.find('.addSymptomBtn').off('click').on('click', () => {
        $('#symptomModal .modal-title').text('Add Symptom (Diary)');
        $('#symptomTime').val(hourStr);
        populateSymptomSelect();
        $('#symptomSelect').val('').trigger('change');
        $('#quickSymptomName').val('');
        $('#symptomSeverity').val(5);
        $('#symptomFrequency').val('once');
        if (tsSymptomAllergens) tsSymptomAllergens.clear();
        $('#symptomModalSave').removeData('editIndex');
        $('#symptomModal').modal('show');
      });

      $('#diaryGrid').append(row);
    }
  }


  function analyseTriggers() {
    const results = {};
    const exposures = [];
    const symptoms = [];

    // Build exposures and symptoms
    state.diary.forEach(entry => {
      if (entry.type === "food") {
        const food = state.foods.find(f => f.id === entry.foodId);
        if (food) {
          food.allergenIds.forEach(aid => {
            exposures.push({ datetime: new Date(entry.datetime), allergenId: aid });
          });
        }
      } else if (entry.type === "symptom") {
        symptoms.push({
          datetime: new Date(entry.datetime),
          symptomId: entry.symptomId,
          severity: entry.severity
        });
      }
    });

    // Match symptoms to exposures
    symptoms.forEach(sym => {
      exposures.forEach(exp => {
        const allergen = state.allergens.find(a => a.id === exp.allergenId);
        if (!allergen) return;

        const delta = (sym.datetime - exp.datetime) / (1000 * 60 * 60); // hours
        if (delta > 0 && delta <= allergen.windowHours) {
          if (!results[exp.allergenId]) {
            results[exp.allergenId] = { exposures: 0, symptomLinks: 0, weightedLinks: 0, symptoms: {}, timeDeltas: [] };
          }
          results[exp.allergenId].symptomLinks++;
          results[exp.allergenId].weightedLinks += sym.severity;
          results[exp.allergenId].timeDeltas.push(delta);

          // Track per-symptom stats
          const symStats = results[exp.allergenId].symptoms[sym.symptomId] || { count: 0, totalSeverity: 0, maxSeverity: 0, times: [] };
          symStats.count++;
          symStats.totalSeverity += sym.severity;
          symStats.maxSeverity = Math.max(symStats.maxSeverity, sym.severity);
          symStats.times.push(delta);
          results[exp.allergenId].symptoms[sym.symptomId] = symStats;
        }
      });
    });

    // Count exposures
    exposures.forEach(exp => {
      results[exp.allergenId] = results[exp.allergenId] || { exposures: 0, symptomLinks: 0, weightedLinks: 0, symptoms: {}, timeDeltas: [] };
      results[exp.allergenId].exposures++;
    });

    // Build final report
    const report = Object.keys(results).map(aid => {
      const allergen = state.allergens.find(a => a.id == aid);
      const r = results[aid];
      const avgTime = r.timeDeltas.length > 0
        ? (r.timeDeltas.reduce((a,b) => a+b, 0) / r.timeDeltas.length).toFixed(1)
        : "—";
      return {
        allergen: allergen ? allergen.name : "Unknown",
        exposures: r.exposures,
        symptomLinks: r.symptomLinks,
        weightedLinks: r.weightedLinks,
        score: r.exposures > 0 ? (r.weightedLinks / r.exposures) : 0,
        avgTimeToSymptom: avgTime,
        windowHours: allergen ? allergen.windowHours : "—",
        symptoms: Object.keys(r.symptoms).map(sid => {
          const s = state.symptoms.find(sym => sym.id == sid);
          const stats = r.symptoms[sid];
          const avgTime = stats.times.length > 0
            ? (stats.times.reduce((a,b)=>a+b,0) / stats.times.length).toFixed(1)
            : "—";
          return {
            symptom: s ? s.name : "Unknown",
            count: stats.count,
            avgSeverity: (stats.totalSeverity / stats.count).toFixed(1),
            maxSeverity: stats.maxSeverity,
            avgTime: avgTime
          };
        })
      };
    }).sort((a,b) => b.score - a.score);

    return report;
  }

  // ---------- Report generation ----------
  function generateReport() {
    const report = analyseTriggers();
    const container = document.getElementById('reportContent');
    container.innerHTML = "";

    if (report.length === 0) {
      container.innerHTML = "<p>No correlations found yet.</p>";
      return;
    }

    report.forEach(item => {
      const div = document.createElement('div');
      div.className = "mb-3";
      div.innerHTML = `
        <h5>${item.allergen} — Score: ${item.score.toFixed(2)}</h5>
        <p>
          <strong>Exposures:</strong> ${item.exposures}, 
          <strong>Symptom Links:</strong> ${item.symptomLinks}, 
          <strong>Weighted Severity:</strong> ${item.weightedLinks}<br/>
          <strong>Avg Time to Symptom:</strong> ${item.avgTimeToSymptom}h (Window: ${item.windowHours}h)
        </p>
        <ul class="list-group">
          ${item.symptoms.map(s => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
              ${s.symptom}
              <span>
                Count: ${s.count}, Avg Severity: ${s.avgSeverity}, Max: ${s.maxSeverity}, Avg Time: ${s.avgTime}h
              </span>
            </li>
          `).join("")}
        </ul>
      `;
      container.appendChild(div);
    });
  }

  // ---------- Manage Foods logic ----------
  function onManageFoodSelectChange(){
    const val = $('#manageFoodSelect').val();
    if(val === 'new' || !val){
      $('#manageFoodName').val('');
      if(tsManageFoodAllergens) tsManageFoodAllergens.clear(true);
      $('#deleteFoodBtn').prop('disabled', true);
      return;
    }
    const id = Number(val);
    const f = state.foods.find(x=>x.id===id);
    if(!f) return;
    $('#manageFoodName').val(f.name);
    if(tsManageFoodAllergens){
      tsManageFoodAllergens.clear(true);
      f.allergenIds.forEach(id => tsManageFoodAllergens.addItem(String(id)));
    }
    $('#deleteFoodBtn').prop('disabled', false);
  }

  $('#saveManageFoodBtn').click(()=>{
    const sel = $('#manageFoodSelect').val();
    const name = $('#manageFoodName').val().trim();
    if(!name) return alert('Food name required');
    // get allergens ids from tsManageFoodAllergens
    const selectedAllergenValues = tsManageFoodAllergens.getValue() || []; // array of strings (ids)
    const allergenIds = (Array.isArray(selectedAllergenValues) ? selectedAllergenValues : (selectedAllergenValues?selectedAllergenValues.split(','):[])).map(v=>Number(v));
    if(sel === 'new' || !sel){
      const id = state.nextFoodId++;
      state.foods.push({id, name, allergenIds});
      populateFoodSelect();
    } else {
      const id = Number(sel);
      const f = state.foods.find(x=>x.id===id);
      if(!f) return alert('Selected food not found');
      f.name = name;
      f.allergenIds = allergenIds;
    }
    saveState();
    populateFoodSelect();
    renderFoodsList();
    // refresh other controls
    populateFoodSelect();
    renderDiary();
    alert('Saved');
  });

  $('#deleteFoodBtn').click(()=>{
    const sel = $('#manageFoodSelect').val();
    if(!sel || sel==='new') return;
    if(!confirm('Delete this food? This will not remove diary entries (they will show as Unknown).')) return;
    const id = Number(sel);
    state.foods = state.foods.filter(f=>f.id!==id);
    saveState();
    populateFoodSelect();
    renderFoodsList();
    renderDiary();
    $('#manageFoodSelect').val('new');
    onManageFoodSelectChange();
  });

  // ---------- Manage Allergens logic ----------
  $('#addAllergenBtn').click(()=>{
    const name = $('#newAllergenName').val().trim();
    if(!name) return alert('Enter allergen name');
    createAllergen(name);
    $('#newAllergenName').val('');
  });

  // delete allergen buttons in list (delegated)
  $('#allergensList').on('click', '.remove-allergen-btn', function(){
    const id = Number($(this).data('id'));
    if(!confirm('Delete allergen? This will remove it from foods and symptoms.')) return;
    // remove from state
    state.allergens = state.allergens.filter(a=>a.id!==id);
    // remove references
    state.foods.forEach(f=> f.allergenIds = f.allergenIds.filter(x=>x!==id));
    state.symptoms.forEach(s=> s.allergenIds = s.allergenIds.filter(x=>x!==id));
    saveState();
    refreshAllergenTomSelectData();
    populateFoodSelect();
    populateSymptomSelect();
    renderAllergensList();
    renderFoodsList();
    renderSymptomsList();
    renderDiary();
  });

  // ---------- Manage Symptoms logic ----------
  function onManageSymptomSelectChange(){
    const val = $('#manageSymptomSelect').val();
    if(val === 'new' || !val){
      $('#manageSymptomName').val('');
      if(tsManageSymptomAllergens) tsManageSymptomAllergens.clear(true);
      $('#deleteSymptomBtn').prop('disabled', true);
      return;
    }
    const id = Number(val);
    const s = state.symptoms.find(x=>x.id===id);
    if(!s) return;
    $('#manageSymptomName').val(s.name);
    if(tsManageSymptomAllergens){
      tsManageSymptomAllergens.clear(true);
      s.allergenIds.forEach(id => tsManageSymptomAllergens.addItem(String(id)));
    }
    $('#deleteSymptomBtn').prop('disabled', false);
  }

  $('#saveManageSymptomBtn').click(()=>{
    const sel = $('#manageSymptomSelect').val();
    const name = $('#manageSymptomName').val().trim();
    if(!name) return alert('Symptom name required');
    const selected = tsManageSymptomAllergens.getValue() || [];
    const allergenIds = (Array.isArray(selected) ? selected : (selected?selected.split(','):[])).map(v=>Number(v));
    if(sel === 'new' || !sel){
      const id = state.nextSymptomId++;
      state.symptoms.push({id, name, allergenIds});
    } else {
      const id = Number(sel);
      const s = state.symptoms.find(x=>x.id===id);
      if(!s) return alert('Selected symptom not found');
      s.name = name;
      s.allergenIds = allergenIds;
    }
    saveState();
    populateSymptomSelect();
    renderSymptomsList();
    alert('Saved');
  });

  $('#deleteSymptomBtn').click(()=>{
    const sel = $('#manageSymptomSelect').val();
    if(!sel || sel==='new') return;
    if(!confirm('Delete this symptom? This will not remove diary entries (they will show as Unknown).')) return;
    const id = Number(sel);
    state.symptoms = state.symptoms.filter(s=>s.id!==id);
    saveState();
    populateSymptomSelect();
    renderSymptomsList();
    renderDiary();
    $('#manageSymptomSelect').val('new');
    onManageSymptomSelectChange();
  });

  // ---------- Add Food to Diary (foodModal) ----------
  $('#foodSelect').change(function(){
    const val = $(this).val();
    if(val === 'new'){
      $('#quickNewFood').removeClass('d-none');
      // clear quick name + allergens
      $('#quickFoodName').val('');
      if(tsQuickFoodAllergens) tsQuickFoodAllergens.clear(true);
    } else {
      $('#quickNewFood').addClass('d-none');
    }
  });

  $('#foodModalSave').off('click').on('click', function(){
    const sel = $('#foodSelect').val();
    let foodId;

    if (sel === 'new') {
      const name = $('#quickFoodName').val().trim();
      if (!name) { alert('Please enter a name for the new food'); return; }
      // get allergen ids from TomSelect
      const selectedAllergenValues = tsQuickFoodAllergens.getValue() || [];
      const allergenIds = (Array.isArray(selectedAllergenValues) ? selectedAllergenValues : (selectedAllergenValues?selectedAllergenValues.split(','):[])).map(v=>Number(v));
      const id = state.nextFoodId++;
      state.foods.push({ id, name, allergenIds });
      foodId = id;
      populateFoodSelect();
    } else {
      foodId = Number(sel);
    }

    const qty = $('#foodQty').val().trim();
    const time = $('#foodTime').val();
    if (!time) { alert('Please set a time'); return; }
    const datetime = `${state.currentDate}T${time}`;

    const editIndex = $('#foodModalSave').data('editIndex');
    if (typeof editIndex !== 'undefined') {
      // update existing entry
      const entry = state.diary[editIndex];
      if (entry) {
        entry.type = 'food';
        entry.foodId = foodId;
        entry.quantity = qty;
        entry.datetime = datetime;
      }
    } else {
      // add new
      state.diary.push({ datetime, type: 'food', foodId, quantity: qty });
    }

    saveState();
    $('#foodModal').modal('hide');
    renderDiary();
  });

  // ---------- Add Symptom to Diary (symptomModal) ----------
  $('#symptomModalSave').off('click').on('click', function(){
    const sel = $('#symptomSelect').val();
    const quick = $('#quickSymptomName').val().trim();
    let symptomId;

    if (quick) {
      // create new symptom (and link allergens if selected)
      const selected = tsSymptomAllergens.getValue() || [];
      const allergenIds = (Array.isArray(selected) ? selected : (selected?selected.split(','):[])).map(v=>Number(v));
      symptomId = state.nextSymptomId++;
      state.symptoms.push({ id: symptomId, name: quick, allergenIds });
      populateSymptomSelect();
    } else if (sel) {
      symptomId = Number(sel);
    } else {
      alert('Please select or enter a symptom name'); return;
    }

    const severity = Number($('#symptomSeverity').val()) || 5;
    const frequency = $('#symptomFrequency').val();
    const time = $('#symptomTime').val();
    if (!time) { alert('Please set a time'); return; }
    const datetime = `${state.currentDate}T${time}`;

    const editIndex = $('#symptomModalSave').data('editIndex');
    if (typeof editIndex !== 'undefined') {
      const entry = state.diary[editIndex];
      if (entry) {
        entry.type = 'symptom';
        entry.symptomId = symptomId;
        entry.severity = severity;
        entry.frequency = frequency;
        entry.datetime = datetime;
      }
    } else {
      state.diary.push({ datetime, type: 'symptom', symptomId, severity, frequency });
    }

    saveState();
    $('#symptomModal').modal('hide');
    renderDiary();
  });

  // ---------- Date navigation ----------
  $('#prevDay').click(()=>{
    const d = new Date(state.currentDate);
    d.setDate(d.getDate()-1);
    state.currentDate = d.toISOString().split('T')[0];
    renderDiary();
  });
  $('#nextDay').click(()=>{
    const d = new Date(state.currentDate);
    d.setDate(d.getDate()+1);
    state.currentDate = d.toISOString().split('T')[0];
    renderDiary();
  });

  $('#manageFoodsModal').on('show.bs.modal', function(){
    populateFoodSelect();
    // ensure manageFoodSelect triggers populate of fields
    $('#manageFoodSelect').off('change').on('change', onManageFoodSelectChange);
    // default to new
    $('#manageFoodSelect').val('new');
    onManageFoodSelectChange();
  });

  $('#manageAllergensModal').on('show.bs.modal', function(){
    renderAllergensList();
  });

  $('#manageSymptomsModal').on('show.bs.modal', function(){
    populateSymptomSelect();
    $('#manageSymptomSelect').off('change').on('change', onManageSymptomSelectChange);
    $('#manageSymptomSelect').val('new');
    onManageSymptomSelectChange();
  });

  $('#reportModal').on('show.bs.modal', generateReport);

  // ---------- Utility: escape html ----------
  function escapeHtml(str){ return String(str || '').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  // ---------- Initialize TomSelect instances with create handler that creates allergen in state and returns new id ----------
  function initTomSelects(){
    const makeOpts = {
      persist: false,
      create: function(input){
        // on create it should add to state and return an option with the new id
        const newId = state.nextAllergenId++;
        const o = { value: String(newId), text: input };
        // push allergen into state and save
        state.allergens.push({id: newId, name: input});
        saveState();
        // add to other ts instances later via refreshAllergenTomSelectData
        refreshAllergenTomSelectData();
        renderAllergensList();
        return o;
      },
      render: {
        option: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
        item: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; }
      }
    };

    // quickFoodAllergens
    tsQuickFoodAllergens = new TomSelect('#quickFoodAllergens', Object.assign({plugins:['remove_button']}, makeOpts));
    tsManageFoodAllergens = new TomSelect('#manageFoodAllergens', Object.assign({plugins:['remove_button']}, makeOpts));
    tsSymptomAllergens = new TomSelect('#symptomAllergens', Object.assign({plugins:['remove_button']}, makeOpts));
    tsManageSymptomAllergens = new TomSelect('#manageSymptomAllergens', Object.assign({plugins:['remove_button']}, makeOpts));

    // First load options from state
    refreshAllergenTomSelectData();
  }

  // ---------- Keyboard / quick utilities ----------
  $(document).on('keydown', function(e){
    if(e.key === 'Escape'){
      // close any bootstrap modal
    }
  });

  // ---------- Boot sequence ----------
  loadState();
  initTomSelects();
  populateFoodSelect();
  populateSymptomSelect();
  renderAllergensList();
  renderFoodsList();
  renderSymptomsList();
  renderDiary();

  // wire up manageFoodSelect change once tomselect initialized
  $('#manageFoodSelect').on('change', onManageFoodSelectChange);

  // wire up manageSymptomSelect change
  $('#manageSymptomSelect').on('change', onManageSymptomSelectChange);

  // ---------- Delete confirmation or other UX helpers ----------
  // Nothing else for now; additions handled above.

});