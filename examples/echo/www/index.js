import {FlowNode, Flow, FlowMessage} from "./js/flow.mjs";

const node = new FlowNode();

class TestClient extends Flow {
  constructor() {
    super('TestClient');
  }
  async run(flowMessage) {
    console.log("[TestClient] Received Message :: "+JSON.stringify(flowMessage, null, 2));
  }
  test () {
    const testMessage = new FlowMessage(this.id, 'Echo', {data: 42}, this.id);
    console.log("[TestClient] Sending Message :: "+JSON.stringify(testMessage, null, 2));
    node.flowRouter.routeFlowMessage(testMessage);  
  }
}
const testClient = new TestClient();

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
  node.flowRouter.routeFlowMessage(flow_message);
});