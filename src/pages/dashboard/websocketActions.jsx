export const subscribeToOrderBook = (socket, exchanges, pair) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        command: 'subscribe',
        data_type: 'order_book',
        exchanges,
        pair,
      })
    );
  }
};

export const unsubscribeToOrderBook = (socket, exchanges, pair) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        command: 'unsubscribe',
        data_type: 'order_book',
        exchanges,
        pair,
      })
    );
  }
};

export const subscribeToPairPrice = (socket, exchange, pair) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        command: 'subscribe',
        data_type: 'pair_price',
        exchange,
        pair,
      })
    );
  }
};

export const unsubscribeToPairPrice = (socket, exchange, pair) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        command: 'unsubscribe',
        data_type: 'pair_price',
        exchange,
        pair,
      })
    );
  }
};

export const sendKeepAlive = (socket) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        command: 'keep_alive',
      })
    );
  }
};
