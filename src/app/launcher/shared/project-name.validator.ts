import { Directive, forwardRef } from '@angular/core';
import { NG_ASYNC_VALIDATORS, Validator, ValidatorFn, AbstractControl } from '@angular/forms';
import { Observable } from 'rxjs';

import { DependencyCheckService } from '../service/dependency-check.service';

@Directive({
  selector: '[validateProjectName]',
  providers: [{ provide: NG_ASYNC_VALIDATORS, useExisting:
    forwardRef(() => ProjectNameValidatorDirective), multi: true }]
})
export class ProjectNameValidatorDirective implements Validator {
  private pattern = /^[a-z][a-z0-9-]{3,63}$/;

  constructor(private dependencyCheckService: DependencyCheckService) { }

  validate(control: AbstractControl): Observable<{ [key: string]: any }> {
    return this.validRepositoryName(control.value).debounceTime(500).distinctUntilChanged().first();
  }

  validRepositoryName(value: any): Observable<{ [key: string]: any }> {
    return new Observable((resolve) => {
      const valid = this.pattern.test(value);
      if (!valid) {
        resolve.next(this.createError('pattern', value));
      } else {
        this.dependencyCheckService.getApplicationsInASpace().subscribe(apps => {
          const applicationNames = apps.map(
            app => app.attributes.name ? (<string>app.attributes.name).toLowerCase() : ''
          );
          resolve.next(applicationNames.indexOf(value) !== -1 ? this.createError('duplicate', value) : {});
        });
      }
    });
  }

  private createError(key: string, value: any): any {
    return { [key]: { value: value } };
  }
}
