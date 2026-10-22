import { SetMetadata } from '@nestjs/common';

export const ALLOW_NOT_ONBOARDED_KEY = 'allowNotOnboarded';

// For routes a signed-in person can call before having a User (onboarding).
export const AllowNotOnboarded = (): MethodDecorator & ClassDecorator => SetMetadata(ALLOW_NOT_ONBOARDED_KEY, true);
