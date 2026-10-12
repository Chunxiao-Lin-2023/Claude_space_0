/* boot last, after every module's top-level state exists */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
