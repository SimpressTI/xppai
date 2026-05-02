'use strict';

// Synthetic, non-production XPO fragment used for parser tests.
function xpoLoadSampleFragment() {
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

// Synthetic, non-production XPO with explicit END* closers used for completeness-gated stdin tests.
function xpoLoadSampleComplete() {
  return [
    'Class #MyClass',
    'METHODS',
    '  public void run()',
    '  {',
    '  }',
    'ENDCLASS',
    'Table #CustTable',
    'FIELDS',
    '  CustAccount',
    'ENDTABLE',
    'Form #SalesTable',
    'DESIGN',
    'ENDFORM',
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
  xpoLoadSampleFragment,
  xpoLoadSampleComplete,
  classesVersion1,
  classesVersion2,
};
