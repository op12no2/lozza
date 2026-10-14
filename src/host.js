const nodeHost = (typeof process) != 'undefined';

const fs = (nodeHost) ? require('fs') : 0;
