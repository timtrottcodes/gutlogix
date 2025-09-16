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
        {id:1, name:'Gluten'},
        {id:2, name:'Dairy'},
        {id:3, name:'FODMAP'},
        {id:4, name:'Soy'},
        {id:5, name:'Egg'},
        {id:6, name:'Nuts'},
        {id:7, name:'Shellfish'},
        {id:8, name:'Caffeine'},
        {id:9, name:'Alcohol'}
      ];
      state.nextAllergenId = 10;

      state.foods = [
        {id:1, name:'Bread', allergenIds:[1]},
        {id:2, name:'Milk', allergenIds:[2]},
        {id:3, name:'Cheese', allergenIds:[2]},
        {id:4, name:'Yogurt', allergenIds:[2]},
        {id:5, name:'Pasta', allergenIds:[1]},
        {id:6, name:'Rice', allergenIds:[]},
        {id:7, name:'Eggs', allergenIds:[5]},
        {id:8, name:'Chicken', allergenIds:[]},
        {id:9, name:'Beef', allergenIds:[]},
        {id:10, name:'Fish', allergenIds:[7]},
        {id:11, name:'Tofu', allergenIds:[4]},
        {id:12, name:'Peanuts', allergenIds:[6]},
        {id:13, name:'Almonds', allergenIds:[6]},
        {id:14, name:'Beer', allergenIds:[1,9]},
        {id:15, name:'Coffee', allergenIds:[8]},
        {id:16, name:'Onions', allergenIds:[3]},
        {id:17, name:'Garlic', allergenIds:[3]},
        {id:18, name:'Apples', allergenIds:[3]},
        {id:19, name:'Bananas', allergenIds:[]},
        {id:20, name:'Chocolate', allergenIds:[2,8]}
      ];
      state.nextFoodId = 21;

      state.symptoms = [
        {id:1, name:'Bloating', allergenIds:[1,3,2]},
        {id:2, name:'Diarrhea', allergenIds:[2,3,9]},
        {id:3, name:'Constipation', allergenIds:[1,3]},
        {id:4, name:'Abdominal Pain', allergenIds:[1,2,3]},
        {id:5, name:'Gas/Flatulence', allergenIds:[3]},
        {id:6, name:'Fatigue', allergenIds:[8,9]},
        {id:7, name:'Nausea', allergenIds:[2,9]},
        {id:8, name:'Headache', allergenIds:[8,9]},
        {id:9, name:'Heartburn', allergenIds:[2,8,9]}
      ];
      state.nextSymptomId = 10;

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
  function renderDiary(){
    $('#currentDate').text(state.currentDate);
    $('#diaryGrid').empty();
    for(let h=0; h<24; h++){
      const hourStr = h.toString().padStart(2,'0') + ':00';
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
      const entries = state.diary.filter(d => d.datetime.startsWith(state.currentDate) && new Date(d.datetime).getHours()===h);
      entries.forEach(e=>{
        let text = '';
        if(e.type==='food'){
          const f = state.foods.find(ff=>ff.id===e.foodId);
          text = f ? `${f.name}${e.quantity?(' • '+e.quantity):''}` : `Unknown food • ${e.quantity||''}`;
        } else if(e.type==='symptom'){
          const s = state.symptoms.find(ss=>ss.id===e.symptomId);
          text = s ? `${s.name} • severity ${e.severity}` : `Unknown symptom • severity ${e.severity}`;
        }
        const div = $(`<div class="entry ${e.type==='food' ? 'food-entry' : 'symptom-entry'}">${escapeHtml(text)}</div>`);
        row.find('.entries').append(div);
      });

      // bind add buttons
      row.find('.addFoodBtn').click(()=>{
        $('#foodTime').val(hourStr);
        $('#foodSelect').val('');
        $('#quickNewFood').addClass('d-none');
        $('#quickFoodName').val('');
        $('#foodQty').val('');
        // reset quickFoodAllergens TomSelect values
        if(tsQuickFoodAllergens) tsQuickFoodAllergens.clear();
        $('#foodModal').modal('show');
      });
      row.find('.addSymptomBtn').click(()=>{
        $('#symptomTime').val(hourStr);
        $('#symptomSelect').val('');
        $('#quickSymptomName').val('');
        $('#symptomSeverity').val(5);
        $('#symptomFrequency').val('once');
        if(tsSymptomAllergens) tsSymptomAllergens.clear();
        $('#symptomModal').modal('show');
      });

      $('#diaryGrid').append(row);
    }
  }

  // ---------- Report generation ----------
  function generateReport(){
    // basic food->symptom occurrences within 6 hours
    const report = {};
    state.foods.forEach(food=>{
      const foodEntries = state.diary.filter(d=>d.type==='food' && d.foodId===food.id);
      if(foodEntries.length===0) return;
      const counts = {};
      foodEntries.forEach(fe=>{
        const feTime = new Date(fe.datetime).getTime();
        state.diary.filter(d=>d.type==='symptom').forEach(se=>{
          const seTime = new Date(se.datetime).getTime();
          if(seTime >= feTime && seTime <= feTime + 6*3600*1000){
            const s = state.symptoms.find(x=>x.id===se.symptomId);
            const sname = s ? s.name : ('symptom#' + se.symptomId);
            counts[sname] = (counts[sname]||0) + 1;
          }
        });
      });
      if(Object.keys(counts).length>0) report[food.name] = counts;
    });

    // Build HTML
    let html = '';
    if(Object.keys(report).length === 0){
      html = '<p>No correlations found yet (no symptoms found within 6 hours of foods).</p>';
    } else {
      for(const foodName in report){
        html += `<h6 class="mt-3">${escapeHtml(foodName)}</h6><ul>`;
        for(const s in report[foodName]){
          html += `<li>${escapeHtml(s)}: ${report[foodName][s]} occurrence(s)</li>`;
        }
        html += '</ul>';
      }
    }

    // Also show counts per allergen (simple heuristic)
    html += '<hr/><h6>Allergen usage (master list)</h6><ul>';
    state.allergens.forEach(a=>{
      const countFoods = state.foods.filter(f=>f.allergenIds.includes(a.id)).length;
      const countSymptoms = state.symptoms.filter(s=>s.allergenIds.includes(a.id)).length;
      html += `<li>${escapeHtml(a.name)} — linked to ${countFoods} food(s), ${countSymptoms} symptom(s)</li>`;
    });
    html += '</ul>';

    $('#reportContent').html(html);
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

  $('#foodModalSave').click(()=>{
    const sel = $('#foodSelect').val();
    let foodId;
    if(sel === 'new'){
      const name = $('#quickFoodName').val().trim();
      if(!name) return alert('New food name required');
      // grab selected allergen ids from tsQuickFoodAllergens
      const selected = tsQuickFoodAllergens.getValue() || [];
      const allergenIds = (Array.isArray(selected) ? selected : (selected?selected.split(','):[])).map(v=>Number(v));
      // create any new allergen strings shouldn't be present since create handler creates ids
      const id = state.nextFoodId++;
      state.foods.push({id, name, allergenIds});
      foodId = id;
      populateFoodSelect();
    } else {
      foodId = Number(sel);
    }
    const qty = $('#foodQty').val().trim();
    const time = $('#foodTime').val();
    if(!time) return alert('Time required');
    const dt = `${state.currentDate}T${time}`;
    state.diary.push({datetime:dt, type:'food', foodId, quantity:qty});
    saveState();
    $('#foodModal').modal('hide');
    renderDiary();
  });

  // ---------- Add Symptom to Diary (symptomModal) ----------
  $('#symptomModalSave').click(()=>{
    let sel = $('#symptomSelect').val();
    const quick = $('#quickSymptomName').val().trim();
    let symptomId;
    if(quick){
      // if quick provided, create new symptom with selected allergen tags
      const selected = tsSymptomAllergens.getValue() || [];
      const allergenIds = (Array.isArray(selected) ? selected : (selected?selected.split(','):[])).map(v=>Number(v));
      symptomId = state.nextSymptomId++;
      state.symptoms.push({id:symptomId, name: quick, allergenIds});
      populateSymptomSelect();
    } else if(sel){
      symptomId = Number(sel);
    } else {
      return alert('Select symptom or enter a new name');
    }
    const severity = Number($('#symptomSeverity').val()) || 5;
    const frequency = $('#symptomFrequency').val();
    const time = $('#symptomTime').val();
    if(!time) return alert('Time required');
    const dt = `${state.currentDate}T${time}`;
    state.diary.push({datetime:dt, type:'symptom', symptomId, severity, frequency});
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

  // ---------- Modal show handlers to ensure selects are populated ----------
  $('#foodModal').on('show.bs.modal', function(){
    populateFoodSelect();
    // initialize quickFoodAllergens TomSelect already handled globally
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