import {RestEvent} from './RestEvent';
import {AuthenticationData} from '../../../structures/AuthenticationData';
import {ApiResponseStatus} from '../../../structures/api/ApiResponseStatus';

abstract class RestAuthenticationEvent<EventData>
  extends RestEvent<EventData> {

  protected constructor(
    eventName: string,
    eventData: EventData,
  ) {
    super(
      `AUTHENTICATION.${eventName}`,
      eventData,
    );
  }
}

export class RestAuthenticateEvent
  extends RestAuthenticationEvent<unknown> {

  constructor() {
    super('Authenticate', {});
  }
}

export class RestAuthenticationFailureEvent
  extends RestEvent<ApiResponseStatus> {

  constructor(
    eventData: ApiResponseStatus,
  ) {
    super(
      'Failure',
      eventData,
    );
  }
}

export class RestAuthenticatedEvent<AuthType extends AuthenticationData>
  extends RestAuthenticationEvent<AuthType> {

  constructor(
    eventData: AuthType,
  ) {
    super(
      'Authenticated',
      eventData,
    );
  }
}

