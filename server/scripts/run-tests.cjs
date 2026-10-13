process.env.DB_PATH = ':memory:';
require('jest').run(['--runInBand','--detectOpenHandles']);
