import { initViewer, loadModel } from './viewer.js';
import { initTree } from './sidebar.js';
import { initDA } from './da.js';

const login = document.getElementById('login');
try {
    const resp = await fetch('/api/auth/profile');
    if (resp.ok) {
        const user = await resp.json();
        login.innerText = `Logout (${user.name})`;
        login.onclick = () => {
            const iframe = document.createElement('iframe');
            iframe.style.visibility = 'hidden';
            iframe.src = 'https://accounts.autodesk.com/Authentication/LogOut';
            document.body.appendChild(iframe);
            iframe.onload = () => {
                window.location.replace('/api/auth/logout');
                document.body.removeChild(iframe);
            };
        }
        const viewer = await initViewer(document.getElementById('preview'));
        initTree('#tree', (fileVersionId, hubId, projectId, folderId, fileItemId, fileName) => {
            loadModel(viewer, window.btoa(fileVersionId).replace(/=/g, ''));
            initDA(fileVersionId, hubId, projectId, folderId, fileItemId, fileName, viewer);
        });
        ///////////////////////////
        /*
                loadModel(
                    viewer, 
                    "dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLlRUUWN5S2hVUklpMmE1RDdkMTA5VHc_dmVyc2lvbj0x"
                );
                initDA(
                    "urn:adsk.wipprod:fs.file:vf.TTQcyKhURIi2a5D7d109Tw?version=1", 
                    "a.YnVzaW5lc3M6YXV0b2Rlc2szNzQz", 
                    "a.YnVzaW5lc3M6YXV0b2Rlc2szNzQzIzIwMjUwMjIyODgyNjczOTc2",
                    "urn:adsk.wipprod:fs.folder:co.ZH844-5CR3Ce2hpbilgksQ", 
                    "urn:adsk.wipprod:dm.lineage:TTQcyKhURIi2a5D7d109Tw", 
                    "MainComponent",
                    viewer);
                    */
        ///////////////////////////
    } else {
        login.innerText = 'Login';
        login.onclick = () => window.location.replace('/api/auth/login');
    }
    login.style.visibility = 'visible';
} catch (err) {
    alert('Could not initialize the application. See console for more details.');
    console.log(err);
}
