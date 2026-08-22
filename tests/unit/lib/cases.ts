import { RuleTester } from 'oxlint/plugins-dev';

export function validWith(
  code: string,
  extra: Omit<RuleTester.ValidTestCase, 'code'>,
): RuleTester.ValidTestCase {
  return { ...extra, code };
}

export function invalidWith(test: RuleTester.InvalidTestCase): RuleTester.InvalidTestCase {
  return test;
}

export function error(messageId: string): RuleTester.Error {
  return { messageId };
}
