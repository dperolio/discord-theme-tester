window.addEventListener('resize', calcHiderTransform);
window.addEventListener('keydown', keyboardShortcuts);
window.addEventListener('click', checkIfPopoutIsOpen);
window.addEventListener('blur', checkIfPopoutIsOpen);

let iframe = document.querySelector('#theme-preview');

iframe.addEventListener('load', updateIframeContent);

async function updateIframeContent({build, directory, view} = {}) {
  let iframe = document.querySelector('#theme-preview');

  if (build) {
    iframe.dataset.build = build;
    iframe.contentWindow.document.querySelector('#discord-css').href = `${build}/default.css`;
    console.log(iframe.contentWindow.document.querySelector('#discord-css').href);
  }
  if (directory) iframe.dataset.directory = directory;
  if (view) iframe.dataset.view = view;

  let buildData = iframe.dataset.build,
      directoryData = iframe.dataset.directory,
      viewData = iframe.dataset.view,
      compactData = iframe.dataset.compact;

  document.documentElement.classList.add('loading-iframe');

  await sleep(500);

  fetch(`preview/${buildData}/${directoryData}/${compactData ? 'compact/' : ''}${viewData}.html`).then(response => {

    if (response.status !== 200) return Promise.reject();

    // The API call was successful!
    return response.text();
  }).then(async html => {

    // Convert the HTML string into a document object
    let parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');

    let iframe = document.querySelector('#theme-preview');

    iframe.contentWindow.document.body = doc.body;

    discordDarkSidebar();

    await sleep(500);

    document.documentElement.classList.remove('loading-iframe', 'iframe-didnt-load');
  }).catch(async err => {

    await sleep(500);
    document.documentElement.classList.remove('loading-iframe');
    // There was an error
    document.documentElement.classList.add('iframe-didnt-load');
  });
}

document.querySelector('.main-nav-hider').addEventListener('click', hideMainNav);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/&/g, 'and')           // Replace & with and
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single
}

async function hideMainNav() {
  if (document.documentElement.classList.contains('main-nav-hidden')) {
    document.documentElement.classList.remove('main-nav-hidden');
  } else {
    document.documentElement.classList.add('main-nav-hidden');

    calcHiderTransform();
  }
}

function calcHiderTransform() {
    let mainNavHider = document.querySelector('.main-nav-hider');

    // Here we're getting the iframe container height and adding 2x the margin (20px) for the top and bottom
    let windowHeight = (window.innerHeight - 30) + 'px';
    // Next we use that computed value to place the main-nav-hider near the bottom right of the screen
    mainNavHider.style.transform = `translate3d(0, ${windowHeight}, 0)`;
}

function keyboardShortcuts(e) {
  if (e.code == 'Escape') {
    closePopouts();

    if (document.documentElement.classList.contains('main-nav-hidden')) {
      document.documentElement.classList.remove('main-nav-hidden');
    }
  }
}

document.querySelector('.main-nav .icon.light-mode').parentElement.addEventListener('click', toggleLightMode);

async function toggleLightMode() {
  document.documentElement.classList.toggle('switching-theme-mode');
  await sleep(250);
  document.documentElement.classList.toggle('light-mode');
  await sleep(250);
  document.documentElement.classList.toggle('switching-theme-mode');
}


let selectOptions = document.querySelectorAll('.select-option');

for (let option of selectOptions) {
  option.addEventListener('click', processSelect);
}

function processSelect(e) {
  let selectOptionsContainer = this.parentElement,
      selectOptions = selectOptionsContainer.children,
      currentOption = this.querySelector('.select-option-span').textContent;

  if (this.classList.contains('select-nested-option')) return;

  if (this.classList.contains('disabled')) {
    e.preventDefault();
    return;
  }

  if (selectOptionsContainer.classList.contains('select-nested-options')) {
    let selectLabel = selectOptionsContainer.closest('.select-label'),
        allOptions = selectLabel.querySelectorAll('.select-option');

    for (let option of allOptions) {
      option.classList.remove('current');
    }

    this.classList.add('current');

    selectLabel.querySelector('.select-option-selected .select-option-selected-text').textContent = currentOption;

    let directory = selectOptionsContainer.parentElement.querySelector('.select-option-span').textContent;
    
    if (selectLabel.querySelector('.view-options')) {
      updateIframeContent({directory: `${slugify(directory)}`, view: `${slugify(currentOption)}`});
    }

    return;
  }

  if (selectOptionsContainer.classList.contains('settings-options')) return;

  for (let option of selectOptions) {
    option.classList.remove('current');
  }

  this.classList.add('current');

  if (selectOptionsContainer.classList.contains('palette-options')) return;

  selectOptionsContainer.closest('.select-label').querySelector('.select-option-selected .select-option-selected-text').textContent = currentOption;

  if (selectOptionsContainer.classList.contains('discord-build')) {
    updateIframeContent({build: `${slugify(currentOption)}`});
  }
}

MicroModal.init({
  onShow: modal => {},
  onClose: modal => {
    modal.classList.remove('modal-is-open');
  },
  openTrigger: 'data-modal-open',
  closeTrigger: 'data-modal-close',
  openClass: 'modal-is-open',
  disableFocus: false,
  awaitOpenAnimation: true,
  awaitCloseAnimation: true
});

document.querySelector('#from-the-web').addEventListener('click', fromTheWeb);
document.querySelector('#from-the-web-2').addEventListener('click', fromTheWeb);
document.querySelector('#from-your-computer').addEventListener('click', fromYourComputer);
document.querySelector('#from-your-computer-2').addEventListener('click', fromYourComputer);

function fromTheWeb() {
  let modal = document.querySelector('#modal'),
      title = modal.querySelector('.modal__title'),
      content = modal.querySelector('.modal__content'),
      submitButton = modal.querySelector('#submit');

  title.textContent = 'Import CSS from URL';
  content.innerHTML = `
    <div class="icon-container" aria-label="Paste URL from clipboard" data-tooltip-position="bottom" role="tooltip">
      <div class="icon-container-inner">
        <icon class="icon clipboard"></icon>
      </div>
    </div>
    <div class="text-input-wrapper">
      <input type="text" name="css-url-input" id="css-url-input" class="text-input" required>
      <span class="text-input-border"></span>
      <div class="icon-container input-clear">
        <div class="icon-container-inner">
          <icon class="icon close"></icon>
        </div>
      </div>
      <label for="css-url-input" class="text-input-label">Enter the URL</label>
    </div>`;

    let clipboardButton = document.querySelector('#modal-content .clipboard').parentElement.parentElement;

    let clearButton = document.querySelector('.input-clear');
    clearButton.addEventListener('click', clearInput);

    function clearInput() {
      document.querySelector('.text-input-wrapper input').value = '';
    }

    clipboardButton.addEventListener('click', pasteIntoInput);
    submitButton.addEventListener('click', importCSSFromURL);
}

function fromYourComputer() {
  let modal = document.querySelector('#modal'),
      title = modal.querySelector('.modal__title'),
      content = modal.querySelector('.modal__content'),
      submitButton = modal.querySelector('#submit');

  title.textContent = 'Import CSS from File';
  content.innerHTML = `
    <div class="icon-container" aria-label="Upload a CSS file" data-tooltip-position="bottom" role="tooltip">
      <div class="icon-container-inner">
        <icon class="icon attachment"></icon>
      </div>
    </div>
    <div class="text-input-wrapper">
      <input type="file" name="css-file-input" id="css-file-input" class="text-input" required>
      <input type="text" name="css-file-text-input" id="css-file-text-input" class="text-input" required>
      <span class="text-input-border"></span>
      <div class="icon-container input-clear">
        <div class="icon-container-inner">
          <icon class="icon close"></icon>
        </div>
      </div>
      <label for="css-url-input" class="text-input-label">Upload your file</label>
    </div>`;

    let attachmentButton = document.querySelector('#modal-content .attachment').parentElement.parentElement;

    attachmentButton.addEventListener('click', submitFile);

    let clearButton = document.querySelector('.input-clear');
    clearButton.addEventListener('click', clearInput);

    function clearInput() {
      document.querySelectorAll('.text-input-wrapper input')[0].value = '';
      document.querySelectorAll('.text-input-wrapper input')[1].value = '';
    }

    let fileInput = document.querySelector('.modal input[type="file"]');

    fileInput.addEventListener('change', fileSubmitted);

    submitButton.addEventListener('click', importCSSFromFile);
}


let paletteOptions = document.querySelectorAll('.palette-options .select-option');

for(let option of paletteOptions) {
  option.addEventListener('click', themeSwitcher);
}

function themeSwitcher() {
  let themeColor = this.querySelector('.select-option-span').classList;

  themeColor = themeColor.value.toString();
  themeColor = themeColor.replace('select-option-span', '').trim();

  document.documentElement.setAttribute('theme-color', themeColor);
}


function closePopouts() {
  let popouts = document.querySelectorAll('.select-container');

  for(let popout of popouts) {
    document.documentElement.classList.remove('popout-is-open');
    popout.classList.remove('open');
    popout.querySelector('input').checked = true;
    popout.querySelector('input').dispatchEvent(new Event('change'));
  }
}

async function pasteIntoInput() {
  let input = document.querySelector('.modal input[type="text"]');

  const text = await navigator.clipboard.readText();
  input.focus();
  input.value = text;
}

function submitFile() {
  let fileInput = document.querySelector('.modal input[type="file"]');

  fileInput.click();
}

function fileSubmitted() {
  let input = document.querySelector('.modal input[type="text"]'),
      fileInput = document.querySelector('.modal input[type="file"]'),
      file = fileInput.value.split("\\"),
      fileName = file[file.length-1];

  input.value = fileName;
}

async function importCSSFromURL() {
  let iframe = document.querySelector('#theme-preview'),
      cssURLInput = document.querySelector('#css-url-input').value,
      userImportedCSS = iframe.contentWindow.document.querySelector('#user-imported-css');

  if (cssURLInput.endsWith('.css')) {
    if (cssURLInput.includes('raw.githubusercontent.com')) {
      cssURLInput = cssURLInput.replace('raw.githubusercontent.com', 'raw.githack.com');
    }
    else if (cssURLInput.includes('github.com')) {
      cssURLInput = cssURLInput.replace('github.com', 'raw.githack.com');
      cssURLInput = cssURLInput.replace('/blob/', '/');
    }

    document.documentElement.classList.add('loading-iframe');
    userImportedCSS.innerHTML = `@import '${cssURLInput}'`;

    await sleep(500);
    document.documentElement.classList.remove('loading-iframe');
  } else {
    Toastify({
      title: 'Error',
      text: "The file must be a CSS file.",
      selector: 'iframe-container',
      duration: 4000,
      close: true,
      gravity: 'top',
      position: 'right', // `left`, `center` or `right`
      stopOnFocus: true // Prevents dismissing of toast on hover
      // async onClick(el) {
      //   el.classList.add('toast-go-away');
      //   await sleep(200);
      //   el.remove();
      // } // Callback after click
    }).showToast();
  }

  let submitButton = modal.querySelector('#submit');

  submitButton.removeEventListener('click', importCSSFromURL);
}

function importCSSFromFile() {
  let fileInput = document.querySelector('#css-file-input'),
      file = fileInput.files[0];

  if (!file) {
    Toastify({
      title: 'Error',
      text: "You did not upload any file.",
      selector: 'iframe-container',
      duration: 4000,
      close: true,
      gravity: 'top',
      position: 'right', // `left`, `center` or `right`
      stopOnFocus: true // Prevents dismissing of toast on hover
      // async onClick(el) {
      //   el.classList.add('toast-go-away');
      //   await sleep(200);
      //   el.remove();
      // } // Callback after click
    }).showToast();

    return;
  }

  const reader = new FileReader();

  reader.onload = async (e) => {
    let iframe = document.querySelector('#theme-preview'),
        userImportedCSS = iframe.contentWindow.document.querySelector('#user-imported-css');

    if ((file.type) == 'text/css') {

      document.documentElement.classList.add('loading-iframe');
    
      let iframeImportedCSS = e.target.result;

      userImportedCSS.innerHTML = iframeImportedCSS;

      await sleep(500);
      document.documentElement.classList.remove('loading-iframe');
    } else {
        Toastify({
          title: 'Error',
          text: "The file must be a CSS file.",
          selector: 'iframe-container',
          duration: 4000,
          close: true,
          gravity: 'top',
          position: 'right', // `left`, `center` or `right`
          stopOnFocus: true // Prevents dismissing of toast on hover
          // async onClick(el) {
          //   el.classList.add('toast-go-away');
          //   await sleep(200);
          //   el.remove();
          // } // Callback after click
        }).showToast();
    }
  };

  reader.readAsText(file);
}

let selectInputs = document.querySelectorAll('.select-input');

for(let input of selectInputs) {
  input.addEventListener('change', handlePopout);
}

function handlePopout() {
  let selectInput = this;
  if (selectInput.checked) {
    selectInput.parentElement.classList.remove('open');
    document.documentElement.classList.remove('popout-is-open');
  } else {
    selectInput.parentElement.classList.add('open');
    document.documentElement.classList.add('popout-is-open');
  }
}

function checkIfPopoutIsOpen(e) {
  let flyoutElement = document.querySelector('.select-container.open'),
      targetElement = e.target; // clicked element

  if (!targetElement || !flyoutElement) return;

  if (!(targetElement instanceof Node)) {
    // If the user clicks an iframe or unfocuses the window
    document.documentElement.classList.remove('popout-is-open');
    flyoutElement.classList.remove('open');
    flyoutElement.querySelector('input').checked = true;
    flyoutElement.dispatchEvent(new Event('change'));
    return;
  }

  let isClickInside = flyoutElement.contains(targetElement);

  if (isClickInside) {
    return;
  }

  // This is a click outside.
  document.documentElement.classList.remove('popout-is-open');
  flyoutElement.classList.remove('open');
  flyoutElement.querySelector('input').checked = true;
  flyoutElement.dispatchEvent(new Event('change'));
}

let switchToggles = document.querySelectorAll('.switch');

for (let switchToggle of switchToggles) {
  switchToggle.addEventListener('change', toggleSwitches);
}

function toggleSwitches(e) {
  let toggleSwitch = this;

  if (!toggleSwitch || !(toggleSwitch instanceof Node)) return;

  if (toggleSwitch.disabled) return;

  if (toggleSwitch.checked) {
    toggleSwitch.parentElement.classList.add('switch-enabled');
  } else {
    toggleSwitch.parentElement.classList.remove('switch-enabled');
  }
}

document.querySelector('#discord-dark-mode').addEventListener('change', discordDarkMode);

function discordDarkMode() {
  let iframe = document.querySelector('#theme-preview'),
      iframeHTML = iframe.contentWindow.document.documentElement,
      darkSidebarSetting = document.querySelector('#discord-dark-sidebar');

  if (this.checked) {
    iframeHTML.classList.remove('theme-light');
    iframeHTML.classList.add('theme-dark');
    darkSidebarSetting.checked = false;
    darkSidebarSetting.dispatchEvent(new Event('change'));
    disableSwitch(darkSidebarSetting);
  } else {
    iframeHTML.classList.remove('theme-dark');
    iframeHTML.classList.add('theme-light');
    unDisableSwitch(darkSidebarSetting);
  }
}

function disableSwitch(item) {
  item.disabled = true;
  item.closest('.select-option-switch').classList.add('disabled');
  // item.removeEventListener('change', toggleSwitches);
}

function unDisableSwitch(item) {
  // item.addEventListener('change', toggleSwitches);
  item.disabled = false;
  item.closest('.select-option-switch').classList.remove('disabled');
}

document.querySelector('#discord-dark-sidebar').addEventListener('change', discordDarkSidebar);

function discordDarkSidebar() {
  let iframe = document.querySelector('#theme-preview'),
      iframeDoc = iframe.contentWindow.document,
      that = document.querySelector('#discord-dark-sidebar');
  
  if (that.checked) {
    // bg
    if (iframeDoc.querySelector('.bg-h5JY_x')) iframeDoc.querySelector('.bg-h5JY_x').classList.add('theme-dark');
    // titlebar
    if (iframeDoc.querySelector('.titleBar-AC4pGV')) iframeDoc.querySelector('.titleBar-AC4pGV').classList.add('theme-dark');
    // guilds sidebar
    if (iframeDoc.querySelector('.guilds-1SWlCJ')) iframeDoc.querySelector('.guilds-1SWlCJ').classList.add('theme-dark');
    // channels sidebar
    if (iframeDoc.querySelector('.sidebar-2K8pFh')) iframeDoc.querySelector('.sidebar-2K8pFh').classList.add('theme-dark');
    // settings sidebar
    if (iframeDoc.querySelector('.sidebarRegion-VFTUkN')) iframeDoc.querySelector('.sidebarRegion-VFTUkN').classList.add('theme-dark');
  } else {
    // bg
    if (iframeDoc.querySelector('.bg-h5JY_x')) iframeDoc.querySelector('.bg-h5JY_x').classList.remove('theme-dark');
    // titlebar
    if (iframeDoc.querySelector('.titleBar-AC4pGV')) iframeDoc.querySelector('.titleBar-AC4pGV').classList.remove('theme-dark');
    // guilds sidebar
    if (iframeDoc.querySelector('.guilds-1SWlCJ')) iframeDoc.querySelector('.guilds-1SWlCJ').classList.remove('theme-dark');
    // channels sidebar
    if (iframeDoc.querySelector('.sidebar-2K8pFh')) iframeDoc.querySelector('.sidebar-2K8pFh').classList.remove('theme-dark');
    // settings sidebar
    if (iframeDoc.querySelector('.sidebarRegion-VFTUkN')) iframeDoc.querySelector('.sidebarRegion-VFTUkN').classList.remove('theme-dark');
  }
}

document.querySelector('#discord-compact-mode').addEventListener('change', discordCompactMode);

function discordCompactMode() {
  let viewOptions = document.querySelectorAll('.view-options .select-option:not(.select-nested-option)'),
      iframe = document.querySelector('#theme-preview'),
      that = document.querySelector('#discord-compact-mode');

  if (that.checked) {
    for (let option of viewOptions) {
      if (option.querySelector('.select-option-span').textContent == 'Server') {
        option.classList.add('current');
      } else {
        option.classList.add('disabled');
      }
    }
    iframe.dataset.compact = 'true';

    updateIframeContent({directory: 'views', view: 'server'});
  } else {
    for (let option of viewOptions) {
      // Temporarily leaving Components disabled
      if (!(option.parentElement.parentElement.querySelector('.select-option-span').textContent == 'Components')) 
        option.classList.remove('disabled');
    }

    iframe.removeAttribute('data-compact');

    updateIframeContent();
  }
}