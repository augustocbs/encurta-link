import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): Promise<boolean> | Observable<boolean> {
    const canActivateResult = super.canActivate(context);

    const observableResult = from(Promise.resolve(canActivateResult)).pipe(
      switchMap((res) => {
        if (res instanceof Observable) {
          return res;
        }
        return from([res]);
      }),
    );

    return observableResult.pipe(
      catchError((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.log(
          'Autenticação JWT opcional falhou, permitindo acesso sem usuário:',
          errorMessage,
        );
        return from([true]);
      }),
    );
  }
}
