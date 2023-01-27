import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './MainContainer';

test('show connect wallet button', () => {
  render(<App />);
  const linkElement = screen.getByText(/connect wallet/i);
  expect(linkElement).toBeInTheDocument();
});
