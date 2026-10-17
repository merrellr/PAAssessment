/* The ranking board used by the owner console and the company dashboard: a
   numbered "Priority order" list and a "Not a priority" bucket. Dragging is
   handled by the Sortable library (smooth, animated, and it works with a finger
   as well as a mouse); the arrow, + and x buttons do the same thing for
   keyboards. It only edits a list of keys through getList/setList, so it knows
   nothing about Firebase. Needs company-core.js and vendor/Sortable.min.js. */
const FocusBoard = (function(){
  const C = CompanyCore;
  let rankedEl, bucketEl, getList, setList, defaultOrder;

  function change(next){ setList(next); render(); }

  function button(text, title, disabled, onClick){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'icon-btn';
    b.textContent = text;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.disabled = !!disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  function makeItem(key, rankIndex, total){
    const li = document.createElement('li');
    li.className = 'focus-item';
    li.dataset.key = key;

    const grip = document.createElement('span');
    grip.className = 'focus-grip';
    grip.textContent = '⠿';
    li.appendChild(grip);

    if (rankIndex >= 0){
      const rank = document.createElement('span');
      rank.className = 'focus-rank';
      rank.textContent = String(rankIndex + 1);
      li.appendChild(rank);
    }

    const name = document.createElement('span');
    name.className = 'focus-name';
    name.textContent = C.domainLabel(key);
    li.appendChild(name);

    if (rankIndex >= 0){
      li.appendChild(button('↑', 'Move up', rankIndex === 0, () => change(C.moveItem(getList(), rankIndex, -1))));
      li.appendChild(button('↓', 'Move down', rankIndex === total - 1, () => change(C.moveItem(getList(), rankIndex, 1))));
      li.appendChild(button('✕', 'Remove from priorities', false, () => change(C.removeFocus(getList(), key))));
    } else {
      li.appendChild(button('+', 'Add to priorities', false, () => change(C.placeFocus(getList(), key, getList().length))));
    }
    return li;
  }

  function placeholder(text){
    const li = document.createElement('li');
    li.className = 'focus-placeholder';
    li.textContent = text;
    return li;
  }

  function render(){
    const list = getList();
    rankedEl.innerHTML = '';
    bucketEl.innerHTML = '';
    if (!list.length) rankedEl.appendChild(placeholder('Drag skill areas here, most important first.'));
    list.forEach((key, i) => rankedEl.appendChild(makeItem(key, i, list.length)));
    const rest = C.availableFocus(list);
    if (!rest.length) bucketEl.appendChild(placeholder('Every skill area is ranked.'));
    rest.forEach(key => bucketEl.appendChild(makeItem(key, -1, 0)));
  }

  // After any drop, the ranked list on screen IS the new ranking.
  function readRanked(){
    return Array.prototype.map.call(rankedEl.querySelectorAll('.focus-item'), li => li.dataset.key);
  }

  function onDragEnd(){
    const next = readRanked();
    setTimeout(() => { setList(next); render(); }, 0);
  }

  function init(opts){
    rankedEl = opts.rankedEl;
    bucketEl = opts.bucketEl;
    getList = opts.getList;
    setList = opts.setList;
    defaultOrder = opts.defaultOrder || [];
    if (window.Sortable){
      const common = {
        group: 'focus',
        draggable: '.focus-item',
        animation: 180,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        forceFallback: true,
        fallbackOnBody: true,
        fallbackTolerance: 3,
        filter: '.icon-btn',
        preventOnFilter: false,
        ghostClass: 'focus-ghost',
        chosenClass: 'focus-chosen',
        dragClass: 'focus-drag',
        delay: 120,
        delayOnTouchOnly: true,
        touchStartThreshold: 4,
        emptyInsertThreshold: 30,
        onEnd: onDragEnd
      };
      Sortable.create(rankedEl, common);
      Sortable.create(bucketEl, Object.assign({}, common, { sort: false }));
    }
    render();
  }

  function resetToDefault(){ change(defaultOrder.slice()); }

  return { init, render, resetToDefault };
})();
