
// import ClientFlowNode from "./js/flow-node.mjs";
// import FlowMessage from "./js/flow/flow-message.mjs";
import {FlowNode, FlowMessage} from "./flow.mjs";

const testClient = new FlowNode();

document.getElementById("testButton").addEventListener('click', () => {
    testClient.test();
});
document.getElementById('loadModule').addEventListener('click', async () => {
  const module = await import('./js/echo-flow.mjs');
  // Use the module
});
document.getElementById('loadRemoteModule').addEventListener('click', async () => {
  const module_name = './echo-flow.mjs';  //Finding the correct path for the module can be tricky...
  const flow_message = new FlowMessage(null, "ModuleLoaderFlow", module_name, null);
  testClient.flowRouter.routeFlowMessage(flow_message);
});