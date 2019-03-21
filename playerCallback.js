class PlayerCallback extends mm.BasePlayerCallback {
    constructor() {
        super();
    }

    run(n,t) {
        console.log("callback");
      }
    
      stop() {
        console.log("stopped");
      }
}