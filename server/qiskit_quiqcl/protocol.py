"""Communication protocol upon TCP used by qiskit_quiqcl.

[Protocol]

All messages are composed of a <header> part,  a <text> part, and an optional
<payload> part. The lengths of the <text> part and the <payload> part are
specified in the <header> part.

'latin-1' encoding is used since 'ascii' cannot handle 128-255.

<header> part (10 bytes):
  @-header: @<9-digit hexadecimal T>
    No payload part. T is the length of the <text> part.
    E.g., '@00000000a' means that this message does not include any
      <payload> part and the size of the <text> part is 10 bytes.
  $-header: $<1-digit hexadecimal T><8-digit hexadecimal P>
    T is the length of the <text> part and P is the length if the <payload>
      part.
    E.g., '$400000014' means that this message contains a 4-byte <text> part
      and a 20-byte <payload> part.

<text> part (1+T bytes):
  Must begin with '!' and this is not counted in T.
  E.g., T=9 for '!TEXT PART'.
  This part may indicate the type or purpose of this message.

<payload> part (1+P bytes):
  Must begin with '#' and this is not counted in P.
  E.g., P=4 for '#\x01\x02\x03\x04'.

<terminator>:
  Each message must end with the terminator string '\r\n'. This is not counted
  in T nor in P.

Example messages:
- '@00000000b!Example MSG\r\n'
- '$b00000008!PAYLOAD MSG#\x02\x04\x06\x08TEST\r\n'
"""

import socket


HEADER_SIZE = 10
ENCODING = 'latin-1'
TERMINATOR = '\r\n'
TERMINATOR_LENGTH = len(TERMINATOR)

# signature characters
SIG_CHAR_HEADER_NO_PAYLOAD = '@'
SIG_CHAR_HEADER_PAYLOAD = '$'
SIG_CHAR_TEXT = '!'
SIG_CHAR_PAYLOAD = '#'


def send_message(sock, text: str, payload: str = None):
    """Sends a message to the given socket following the protocol.
    
    Args:
        sock: The receiver socket (or wrapped socket) object.
        text: <text> part of the message.
        payload: <payload> part of the message.

    Raises:
        ValueError: When the length of text and/or payload is out of range.
    """
    t = len(text)
    p = len(payload) if payload else 0

    if p == 0:
        if not 0 < t < 0x1000000000:
            raise ValueError(f'When there is no payload, text length should be '
                             f'in range (0, {0x1000000000}), but {t} is given.')
        message = ''.join([SIG_CHAR_HEADER_NO_PAYLOAD, f'{t:09x}',
                           SIG_CHAR_TEXT, text, TERMINATOR])
    else:
        if not 0 < t < 0x10:
            raise ValueError(f'When there is payload, text length should be '
                             f'in range (0, {0x10}), but {t} is given.')
        if not 0 < p < 0x100000000:
            raise ValueError(f'Payload length should be in range '
                             f'(0, {0x100000000}), but {p} is given.')
        message = ''.join([SIG_CHAR_HEADER_PAYLOAD, f'{t:01x}{p:08x}',
                           SIG_CHAR_TEXT, text,
                           SIG_CHAR_PAYLOAD, payload, TERMINATOR])

    sock.sendall(message.encode(ENCODING))


def recv_message(sock):
    """Receives a message from the given socket following the protocol.

    Args:
        sock: The sender socket (or wrapped socket) object.

    Raises:
        RuntimeError: When the received message format is wrong.

    Returns:
        A tuple (text, payload). Both text and payload are str. If there is
          no payload, it is None.
    """
    header = sock.recv(HEADER_SIZE).decode(ENCODING)
    if header[0] == SIG_CHAR_HEADER_NO_PAYLOAD:
        t = int(header[1:], 16)
        p = 0
        length = 1 + t + TERMINATOR_LENGTH
    elif header[0] == SIG_CHAR_HEADER_PAYLOAD:
        t = int(header[1:2], 16)
        p = int(header[2:], 16)
        length = 1 + t + 1 + p + TERMINATOR_LENGTH
    else:
        raise RuntimeError(f'Wrong formatted header: {header}')
    
    body = sock.recv(length).decode(ENCODING)
    payload = None
    end_text = 1 + t
    end_payload = end_text + 1 + p

    # fetch text
    text = _fetch(body[:end_text], SIG_CHAR_TEXT)
    if text is None:
        raise RuntimeError(f'Wrong formatted message (text not found): '
                           f'{header}{body}')
    # fetch payload
    if p != 0:
        payload = _fetch(body[end_text:end_payload], SIG_CHAR_PAYLOAD)
        if payload is None:
            raise RuntimeError(f'Wrong formatted message (payload not found): '
                               f'{header}{body}')
    # check terminator
    if body[-TERMINATOR_LENGTH:] != TERMINATOR:
        raise RuntimeError(f'Wrong formatted message (terminator not found): '
                           f'{header}{body}')

    return text, payload


def _fetch(raw_part: str, sig_char: str) -> str:
    """Helper function that checks signature character and returns the content.

    Args:
        raw_part: A raw part string sliced from the received message body.
        sig_char: Expected signature character.

    Returns:
        The content string without the heading signature character.
        When the expected signature character does not match, returns None.
    """
    if raw_part[0] == sig_char:
        return raw_part[1:]
    else:
        return None
