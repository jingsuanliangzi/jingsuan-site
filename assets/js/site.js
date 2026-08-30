
document.querySelectorAll('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());
(function(){
  const modal = document.getElementById('projectContactModal');
  if(!modal) return;
  const body = document.body;
  const titleEl = document.getElementById('projectModalTitle');
  const catEl = document.getElementById('projectModalCategory');
  const descEl = document.getElementById('projectModalDesc');
  const docEl = document.getElementById('projectModalDoc');
  const triggers = document.querySelectorAll('[data-project-trigger]');
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    body.classList.remove('modal-open');
  };
  const openModal = (cfg) => {
    titleEl.textContent = cfg.title || '项目咨询';
    catEl.textContent = cfg.category || 'PROJECT CONSULTATION';
    descEl.textContent = cfg.desc || '请通过下方联系方式与晶算量子沟通项目需求。';
    docEl.href = cfg.doc || 'customer-portal/templates/JSLZ-AI-Project-Requirement-Form.docx';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    body.classList.add('modal-open');
  };
  triggers.forEach(el => {
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      const targetId = el.getAttribute('data-project-target');
      const source = targetId ? document.getElementById(targetId) : el;
      const cfg = {
        category: source?.getAttribute('data-modal-category') || el.getAttribute('data-modal-category'),
        title: source?.getAttribute('data-modal-title') || el.getAttribute('data-modal-title'),
        desc: source?.getAttribute('data-modal-desc') || el.getAttribute('data-modal-desc'),
        doc: source?.getAttribute('data-modal-doc') || el.getAttribute('data-modal-doc')
      };
      openModal(cfg);
    });
  });
  modal.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => { if(e.key==='Escape') closeModal(); });
})();
