// dont lint this
/* eslint-disable */


export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    task: any,
    resolve: (value: any) => void,
    reject: (reason: any) => void
  }> = [];
  private busyWorkers = new Set<Worker>();

  constructor(workerScript: string | URL, size: number = navigator.hardwareConcurrency || 4) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerScript);
      worker.onmessage = (e) => this.handleWorkerMessage(worker, e);
      worker.onerror = (e) => this.handleWorkerError(worker, e);
      this.workers.push(worker);
    }
  }

  private handleWorkerMessage(worker: Worker, e: MessageEvent) {
    this.busyWorkers.delete(worker);
    const task = this.queue.find(t => t.task.workerId === (worker as any).workerId);
    if (task) {
      this.queue = this.queue.filter(t => t !== task);
      task.resolve(e.data);
    }
    this.processQueue();
  }

  private handleWorkerError(worker: Worker, e: ErrorEvent) {
    this.busyWorkers.delete(worker);
    const task = this.queue.find(t => t.task.workerId === (worker as any).workerId);
    if (task) {
      this.queue = this.queue.filter(t => t !== task);
      task.reject(e.error);
    }
    this.processQueue();
  }

  private processQueue() {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
    if (!availableWorker) return;

    const task = this.queue[0];
    this.busyWorkers.add(availableWorker);
    (availableWorker as any).workerId = task.task.workerId;
    availableWorker.postMessage(task.task.data);
  }

  execute<T = any>(data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = {
        workerId: Math.random().toString(36).substr(2, 9),
        data
      };
      
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
    this.busyWorkers.clear();
  }
}
