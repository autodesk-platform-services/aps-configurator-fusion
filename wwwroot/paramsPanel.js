let _paramsPanel = null;

class ParamsPanel extends Autodesk.Viewing.UI.PropertyPanel {
    updateDesignButton = null;
    loader = null;

    constructor(viewer, container, id, title, options) {
        super(container, id, title, options);
        this.viewer = viewer;

        this.updateDesignButton = document.createElement('button');
        this.updateDesignButton.innerText = 'Update Design';

        this.footer.appendChild(this.updateDesignButton);
    }

    getProperties(originalProperties) {
        let result = {};
        const properties = _paramsPanel.container.getElementsByClassName('expanded property'); 
        for (const property of properties) {
            const key = property.getElementsByClassName('property-name')[0].innerText;
            const value = property.getElementsByClassName('property-value')[0].innerText;

            if (originalProperties[key] !== value)
                result[key] = value;
        }
        return result;
    }

    onPropertyClick(property, event) {
        console.log(property, event);

        const target = event.target;

        if (!target.classList.contains('property-value')) 
            return;

        const editBox = document.createElement('input');
        editBox.value = event.target.innerText;
        editBox.style.position = 'relative';
        target.innerHTML = '';
        target.appendChild(editBox);
        editBox.focus();

        editBox.onblur = () => {
            target.innerHTML = editBox.value;
        }
    }

    showLoader() {
        if (this.loader) 
            return;

        this.loader = document.createElement('div');
        this.loader.classList.add('loader');
        this.container.appendChild(this.loader);
    }

    hideLoader() {
        if (!this.loader) 
            return;

        this.container.removeChild(this.loader);
        this.loader = null;
    }

    addProperties(params) {
        for (const key of Object.keys(params)) {
            const param = this.addProperty(key, params[key]);
        }
    }

    showError(htmlContent) {
        this.removeAllProperties();

        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = htmlContent;
        errorDiv.classList.add('error');

        this.container.getElementsByClassName('treeview')[0].appendChild(errorDiv);
    }   
}

export function getParamsPanel(viewer) {
    if (_paramsPanel) 
        return _paramsPanel;

    _paramsPanel = new ParamsPanel(viewer, viewer.container, 'paramsPanel', 'Parameters');

    return _paramsPanel;
}

