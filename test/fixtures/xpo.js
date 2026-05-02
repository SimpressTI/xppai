'use strict';

function xpoLoadSample() {
  return [
    'Class #MyClass',
    'METHODS',
    '  public void run()',
    '  {',
    '  }',
    'Table #CustTable',
    'FIELDS',
    '  CustAccount',
    'Form #SalesTable',
    'DESIGN',
  ].join('\n');
}

function classesVersion1() {
  return [
    'Class #A',
    'METHODS',
    '  public void run()',
    '  {',
    '    info("v1");',
    '  }',
    'Class #B',
    'METHODS',
    '  public void run()',
    '  {',
    '    info("stable");',
    '  }',
  ].join('\n');
}

function classesVersion2() {
  return [
    'Class #A',
    'METHODS',
    '  public void run()',
    '  {',
    '    info("v2");',
    '  }',
    'Class #B',
    'METHODS',
    '  public void run()',
    '  {',
    '    info("stable");',
    '  }',
  ].join('\n');
}

module.exports = {
  xpoLoadSample,
  classesVersion1,
  classesVersion2,
};
