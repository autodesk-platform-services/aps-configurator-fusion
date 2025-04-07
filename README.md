# Configurator for Fusion models 

Based on the [Hubs Browser Tutorial](https://github.com/autodesk-platform-services/aps-hubs-browser-nodejs/blob/develop/README.md) - have a look at that for more details.

![Thumbnail](./thumbnail.png)

## Functionality

Beyond the functionality of that tutorial, this updated version enables users to see all the **Parameters** available in the loaded **Fusion** model.
It also lets you change the parameter values and create a new version of the model with the new parameter values that will be saved in the same folder as the loaded model with a **GUID** attached to the original name.
For this operation the [Design Automation for Fusion](https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/fusion_specific/) APS component is used.

In order to use that component you need to generate a **Personal Access Token** (PAT) on [https://profile.autodesk.com/Security](https://profile.autodesk.com/Security) for **Design Automation for Fusion** and provide that in the input box. 

![Personal Access Token creation](./images/PAT%20creation.drawio.png)

## Running locally

In order to use this sample you need to do a few things and the easiest is to use the [DA CLI Utility](https://github.com/autodesk-platform-services/aps-da-cli) to do it.

You can use this [config.json](./setup/config.json) with the CLI utility. Just fill in the `clientId`, `clientSecret` and `nickname` in it then run these tasks in the following order from **VS Code**'s:
- "Delete App": before you can change the nickname of the app you need to make sure that it has no **Design Automation** resources in it, that's what this taks will take care of
- "Create Keys": we need to create a **private** and **public key** that will be used to sign the activity later on
- "Patch App": this will set the **nickname** of the app and assign the **private key** we just generated to it
- "Activity": this will create the **activity**
- "Sign Activity": this will generate a signature for the activity that we will need to use when trying to run a **work item** based on it using a **3-legged token** (this is a requirement if the **PAT** and the **clientId** used do not belong to the same user) - see [Using 3-legged OAuth Tokens with Design Automation](https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/3-legged-oauth-token-usage/)    

Now create `.env` file in the root of this project with the following content (replace the values with the correct strings):
```
APS_CLIENT_ID="your client id"
APS_CLIENT_SECRET="your client secret"
APS_CALLBACK_URL="http://localhost:8080/api/auth/callback" 
APS_ACTIVITY="<nickname>.ScriptJob+prod"
APS_SIGNED_ACTIVITY="digital signature of the activity"
SERVER_SESSION_SECRET="could be anything you want"
```

## Troubleshooting

Please contact us via https://aps.autodesk.com/en/support/get-help.

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT).
Please see the [LICENSE](LICENSE) file for more details.
