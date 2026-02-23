/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders correctly', async () => {
    let app: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await ReactTestRenderer.act(async () => {
      jest.runOnlyPendingTimers();
    });

    app!.unmount();
  });
});