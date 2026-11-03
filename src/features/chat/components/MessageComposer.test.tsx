import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { sendChatMessage } from '../services/chatClient';

import MessageComposer from './MessageComposer';

jest.mock('../services/chatClient', () => ({ sendChatMessage: jest.fn() }));

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => 'blob:preview');
  URL.revokeObjectURL = jest.fn();
});

const setup = () => {
  const onCancelReply = jest.fn();
  render(<MessageComposer conversationId="c1" replyTo={null} onCancelReply={onCancelReply} />);
  return { box: screen.getByLabelText('Type a message'), user: userEvent.setup() };
};

test('Enter sends the trimmed message and clears the input', async () => {
  const { box, user } = setup();
  await user.type(box, '  hello  {Enter}');

  await waitFor(() => expect(sendChatMessage).toHaveBeenCalledWith('c1', 'hello', undefined, undefined));
  expect(box).toHaveValue('');
});

test('Shift+Enter inserts a newline instead of sending', async () => {
  (sendChatMessage as jest.Mock).mockClear();
  const { box, user } = setup();
  await user.type(box, 'a{Shift>}{Enter}{/Shift}b');

  expect(sendChatMessage).not.toHaveBeenCalled();
  expect(box).toHaveValue('a\nb');
});

test('shows a preview for a picked local file and lets it be removed', async () => {
  const { user } = setup();
  const file = new File(['hi'], 'photo.png', { type: 'image/png' });
  await user.upload(screen.getByTestId('file-input'), file);

  expect(screen.getByAltText('photo.png')).toHaveAttribute('src', 'blob:preview');
  await user.click(screen.getByLabelText('Remove photo.png'));
  expect(screen.queryByAltText('photo.png')).not.toBeInTheDocument();
});
