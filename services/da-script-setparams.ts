import { adsk } from "@adsk/fas";

function run() {
  const scriptParameters = JSON.parse(adsk.parameters);
  if (!scriptParameters) throw Error("Invalid parameters provided.");

  const app = adsk.core.Application.get();
  if (!app) throw Error("No asdk.core.Application.");

  adsk.log(`Running script with parameters: ${JSON.stringify(scriptParameters)}`);

  const { hub, folder, file } = getDmObjects(app, scriptParameters.hubId, scriptParameters.fileURN);

  adsk.log(`Setting active hub: ${hub.name}.`);
  app.data.activeHub = hub;

  adsk.log(`Opening document: ${scriptParameters.fileURN}`);
  const doc = app.documents.open(file, true);
  if (!doc) throw Error("Invalid document.");

  const design = doc.products.itemByProductType(
    "DesignProductType",
  ) as adsk.fusion.Design;

  let inputParams = scriptParameters.parameters;

  // Read current design parameters
  const docParams: adsk.fusion.ParameterList = design.allParameters;
  const before = parametersToObject(docParams);

  if (Object.keys(inputParams).length === 0) {
    adsk.result = JSON.stringify({
      before: before,
    });

    doc.close(false);

    waitForFusion(app);
    
    return;
  }

  for (let name in inputParams) {
    // Set parameters that are specified in the inputParams object,
    // and also exist in the design
    const par: adsk.fusion.Parameter | null = docParams.itemByName(name);
    if (par == null) {
      adsk.log(`Parameter "${name}" not found, skipping`);
      delete inputParams.par;
      continue;
    }
    par.expression = inputParams[name];
  }

  const after = parametersToObject(docParams);

  const message = `Change parameters: [${Object.keys(inputParams).map(
    (key) => `(${key}: ${before[key]} => ${after[key]})`,
  )}]`;
  const saveResult = saveDocument(app, doc, message, folder, scriptParameters.fileSuffix);
  if (!saveResult) throw Error("Failed to save document.");
  const [newDocVersionId, newFileName] = saveResult;

  adsk.result = JSON.stringify({
    before: before,
    after: after,
    newFileVersionId: newDocVersionId,
    newFileName: newFileName,
  });

  doc.close(false);

  waitForFusion(app);
}

function getDmObjects(app: adsk.core.Application, hubId: string, fileURN: string) {
  const hub = app.data.dataHubs.itemById(hubId);
  if (!hub) throw Error(`Hub not found ${hubId}.`);

  const file = app.data.findFileById(fileURN);
  if (!file) throw Error(`File not found ${fileURN}.`);

  const folder = file.parentFolder;

  return {
    hub,
    folder,
    file,
  };
}

function parametersToObject(parameters: adsk.fusion.ParameterList) {
  let out = {};
  for (let i = 0; i < parameters.count; i++) {
    out[parameters.item(i)!.name] = parameters.item(i)!.expression;
  }
  return out;
}

function waitForFusion(app) {
  while (app.hasActiveJobs) {
    wait(2000);
  }
}

function wait(ms: number) {
  const start = new Date().getTime();
  while (new Date().getTime() - start < ms) adsk.doEvents();
}

function waitUntil(condition: () => boolean, ms: number) {
  const start = new Date().getTime(); 
  while (new Date().getTime() - start < ms) {
    adsk.doEvents();
    if (condition()) return;
  }
  throw Error("Timeout"); 
}

function saveDocument(
  app: adsk.core.Application,
  doc: adsk.core.Document,
  message: string,
  destinationFolder: adsk.core.DataFolder,
  fileSuffix: string,
): string[] | null {
  adsk.log("Saving as new document.");

  const newDocName = `${doc.dataFile.name}-${fileSuffix}`;
  let newDocVersionId: string | null = null;

  /*
  const dataFileComplete = {
    notify: (args: adsk.core.DataEventArgs) => {
      adsk.log("Document uploaded");
      adsk.log(args.file.versionId);
      newDocVersionId = args.file.versionId;
    },
  };
  app.dataFileComplete.add(dataFileComplete);
*/

  if (
    doc.saveAs(
      newDocName,
      destinationFolder,
      message,
      "",
    )
  ) {
    adsk.log("Document saved successfully.");
    
    /*
    // Wait for the document upload
    adsk.log("Waiting for document upload...");
    try {
      waitUntil(() => newDocVersionId !== null, 600000);
    } catch (e) {
      adsk.log("Document upload timeout.");
      return null;
    }
      */

    return [newDocVersionId!, newDocName];
  } else {
    adsk.log("Document failed to save.");
    return null;
  }
}

run();
