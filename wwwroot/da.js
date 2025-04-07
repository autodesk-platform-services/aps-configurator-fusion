import { loadModel } from './viewer.js';
import { getParamsPanel } from './paramsPanel.js';

let _hubId = null;
let _projectId = null;
let _folderId = null;
let _fileItemId = null;
let _fileName = null;
let _viewer = null;

export async function initDA(fileVersionId, hubId, projectId, folderId, fileItemId, fileName, viewer) {
  const paramsPanel = getParamsPanel(viewer);
  paramsPanel.removeAllProperties();
  paramsPanel.setVisible(true);

  console.log(fileName);
  console.log(fileVersionId);
  console.log(fileItemId);
  console.log(hubId);
  console.log(projectId);
  console.log(folderId);

  _hubId = hubId;
  _projectId = projectId;
  _folderId = folderId;
  _fileItemId = fileItemId;
  _fileName = fileName;
  _viewer = viewer;

  window.startFetchParams();
}

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

window.getFilerUrn = async (fileName) => {
  while (true) {
    try {
      const res = await fetch(`/api/hubs/${_hubId}/projects/${_projectId}/folders/${_folderId}/files/${fileName}`);

      const fileUrn = await res.json();

      return fileUrn;
    } catch (err) {
      console.log(`File "${fileName}" not available yet`);
      await wait(1000);
    }
  }
}

window.startFetchParams = async () => {
  getParamsPanel(_viewer).showLoader();

  const res = await fetch(`/api/da/${_hubId}/${_fileItemId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      params: {},
      pat: document.getElementById('pat').value
    })
  });
  const workItem = await res.json();

  if (!workItem.id) {
    console.log('Starting work item failed');
    showError(`Fetching params failed: <br /><pre class="prettyprint">${JSON.stringify(workItem, null, 2)}</pre>`);
    getParamsPanel(_viewer).hideLoader();

    return;
  }

  checkFetchParamsStatus(workItem.id);
}

async function checkFetchParamsStatus(workItemId) {
  const res = await fetch(`/api/da/${workItemId}`);

  const workItem = await res.json();

  if (workItem.status === 'pending' || workItem.status === 'inprogress') {
    await wait(3000);
    checkFetchParamsStatus(workItemId);

    return;
  }

  if (workItem.status === 'success') {
    console.log('Fetching params completed successfully: ' + workItem.reportUrl);

    const res = await fetch(workItem.reportUrl);
    const report = await res.json();

    console.log(report);

    const result = JSON.parse(report.result);
    console.log(result);

    showParameters(result.before);

    getParamsPanel(_viewer).hideLoader();

    return;
  }

  if (workItem.status.startsWith('failed')) {
    console.log('Fetching params failed: ' + workItem.reportUrl);
    const report = await fetch(workItem.reportUrl);
    const reportJson = await report.json();
    showError(`Fetching params failed: <br /><pre class="prettyprint">${JSON.stringify(reportJson, null, 2)}</pre>`);
    getParamsPanel(_viewer).hideLoader();

    return;
  }
}

window.startUpdate = async (params) => {
  getParamsPanel(_viewer).showLoader();

  const res = await fetch(`/api/da/${_hubId}/${_fileItemId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      params,
      pat: document.getElementById('pat').value
    })
  });
  const workItem = await res.json();

  if (!workItem.id) {
    console.log('Starting work item failed');
    showError(`Updating params failed: <br /><pre class="prettyprint">${JSON.stringify(workItem, null, 2)}</pre>`);
    getParamsPanel(_viewer).hideLoader();
    
    return;
  }

  checkUpdateStatus(workItem.id);
}

async function checkUpdateStatus(workItemId) {
  const res = await fetch(`/api/da/${workItemId}`);

  const workItem = await res.json();

  if (workItem.status === 'pending' || workItem.status === 'inprogress') {
    await wait(3000);
    checkUpdateStatus(workItemId);

    return;
  }

  if (workItem.status === 'success') {
    console.log('Updating params completed successfully: ' + workItem.reportUrl);

    const res = await fetch(workItem.reportUrl);
    const report = await res.json();

    console.log(report);

    const result = JSON.parse(report.result);
    console.log(result);

    const fileUrn = await window.getFilerUrn(result.newFileName);
    //const fileUrn = result.newFileVersionId;
    if (!fileUrn) {
      console.log('Failed to get URN of new file: ' + workItem.reportUrl);
      const report = await fetch(workItem.reportUrl);
      const reportJson = await report.json();
      showError(`Updating params failed: <br /><pre class="prettyprint">${JSON.stringify(reportJson, null, 2)}</pre>`);
      
      getParamsPanel(_viewer).hideLoader();
      return;
    }

    const fileBase64Urn = window.btoa(fileUrn).replace(/=/g, '').replace(/\//g, '_');
    console.log(fileUrn);
    console.log(fileBase64Urn);

    while (true) {
      try {
        const model = await loadModel(_viewer, fileBase64Urn);

        console.log(model);

        getParamsPanel(_viewer).hideLoader();

        return;
      } catch (err) {
        console.log(err);
        await wait(1000);
      }
    }
  }

  if (workItem.status.startsWith('failed')) {
    console.log('Updating params failed: ' + workItem.reportUrl);
    getParamsPanel(_viewer).hideLoader();

    return;
  }
}

function showParameters(params) {
  const paramsPanel = getParamsPanel(_viewer);
  paramsPanel.removeAllProperties();

  paramsPanel.addProperties(params);

  paramsPanel.setVisible(true);

  paramsPanel.updateDesignButton.onclick = async () => {
    console.log('Update design button clicked');

    const modifiedParams = paramsPanel.getProperties(params);

    window.startUpdate(modifiedParams);
  }
}

function showError(htmlContent) {
  const paramsPanel = getParamsPanel(_viewer);
  paramsPanel.removeAllProperties();

  paramsPanel.showError(htmlContent);

  paramsPanel.setVisible(true);
}