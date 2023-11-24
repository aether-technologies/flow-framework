import {Flow, FlowMessage} from './flow.mjs';

export default class Echo extends Flow {
  constructor() {
    super("Echo");
  }
  async run(message) {
    console.log("[Echo] Echoing FlowMessage with slight change")
    // simply add 'echo=true' in the content then return the message
    if(typeof message.content === 'string') {
      message.content = {
        data: flowMessage.content,
        echo: true
      };
    } else {
      message.content.echo = true;
    }
    return new FlowMessage(message.recipient, message.origin, message.content, message.origin);
  }
}

const echo_flow = new Echo();