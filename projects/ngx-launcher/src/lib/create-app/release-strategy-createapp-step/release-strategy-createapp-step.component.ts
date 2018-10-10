import {
  Component,
  Host,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation } from '@angular/core';

import { PipelineService } from '../../service/pipeline.service';
import { Pipeline } from '../../model/pipeline.model';
import { Selection } from '../../model/selection.model';
import { LauncherComponent } from '../../launcher.component';
import { LauncherStep } from '../../launcher-step';
import { broadcast } from '../../shared/telemetry.decorator';
import { Broadcaster} from 'ngx-base';
import { Runtime } from '../../model/runtime.model';
import { Subscription } from 'rxjs';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'f8launcher-releasestrategy-createapp-step',
  templateUrl: './release-strategy-createapp-step.component.html',
  styleUrls: ['./release-strategy-createapp-step.component.less']
})
export class ReleaseStrategyCreateappStepComponent extends LauncherStep implements OnInit, OnDestroy {
  @Input() id: string;

  private _pipelines: Pipeline[] = [];
  private _allPipelines: Pipeline[] = [];
  private _pipelineId: string;

  private subscriptions: Subscription[] = [];

  constructor(@Host() public launcherComponent: LauncherComponent,
              private pipelineService: PipelineService,
              private broadcaster: Broadcaster) {
    super(launcherComponent);
  }

  ngOnInit() {
    this.launcherComponent.addStep(this);
    this.subscriptions.push(this.pipelineService.getPipelines().subscribe((result: Array<Pipeline>) => {
      this._allPipelines = result;
      this.restoreSummary();
    }));
    this.subscriptions.push(this.broadcaster.on('runtime-changed').subscribe((runtime: Runtime) => {
      this._pipelines = this._allPipelines.filter(({platform}) => platform === runtime.pipelinePlatform);
      if ((this.launcherComponent.summary.pipeline || {} as Pipeline).platform !== runtime.pipelinePlatform) {
        this.updatePipelineSelection(undefined);
      }
    }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  // Accessors

  /**
   * Returns a list of pipelines to display
   *
   * @returns {Pipeline[]} The list of pipelines
   */
  get pipelines(): Pipeline[] {
    return this._pipelines;
  }

  /**
   * Returns pipeline ID
   *
   * @returns {string} The pipeline ID
   */
  get pipelineId(): string {
    return this._pipelineId;
  }

  /**
   * Set the pipeline ID
   *
   * @param {string} val The pipeline ID
   */
  set pipelineId(val: string) {
    this._pipelineId = val;
  }

  /**
   * Returns indicator that step is completed
   *
   * @returns {boolean} True if step is completed
   */
  get completed(): boolean {
    return (this.launcherComponent.summary.pipeline !== undefined);
  }

  // Steps
  @broadcast('completePipelineStep_Create', {
    'launcherComponent.summary.pipeline': {
      pipeline: 'name'
    }
  })
  navToNextStep(): void {
    this.launcherComponent.navToNextStep('ReleaseStrategy');
  }

  updatePipelineSelection(pipeline: Pipeline): void {
    this.launcherComponent.summary.pipeline = pipeline;
  }

  // Private

  // Restore mission & runtime summary
  private restoreSummary(): void {
    const selection: Selection = this.launcherComponent.selectionParams;
    if (selection === undefined) {
      return;
    }
    this.pipelineId = selection.pipelineId;
    for (let i = 0; i < this.pipelines.length; i++) {
      if (this.pipelineId === this.pipelines[i].id) {
        this.launcherComponent.summary.pipeline = this.pipelines[i];
      }
    }
  }

  toggleExpanded(pipeline: Pipeline) {
    pipeline.expanded = (pipeline.expanded !== undefined) ? !pipeline.expanded : true;
  }
}