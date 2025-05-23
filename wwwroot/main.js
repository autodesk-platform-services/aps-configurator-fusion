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
        const pat = document.getElementById('pat');
        pat.style.display = 'block';
        initTree('#tree', (fileVersionId, hubId, projectId, folderId, fileItemId, fileName) => {
            if (pat.value === '') {
                alert('Please enter a valid PAT token!\n(click ⓘ next to input box for more info)');
                return;
            }

            loadModel(viewer, window.btoa(fileVersionId).replace(/=/g, ''));
            initDA(fileVersionId, hubId, projectId, folderId, fileItemId, fileName, viewer);
        });
    } else {
        login.innerText = 'Login';
        login.onclick = () => window.location.replace('/api/auth/login');
    }
    login.style.visibility = 'visible';
} catch (err) {
    alert('Could not initialize the application. See console for more details.');
    console.log(err);
}
