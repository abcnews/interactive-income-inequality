function FromLocaleString(/* localeData */) {
  "use strict";

  var that = this;
  this.localeData = arguments;

  // get thousands- and decimal-separators
  function getSeparators() {

    // known number.
    // the thousands-separator will be between 1 and 2.
    // the decimal-separator will be between 4 and 5.
    var number = 1234.5679123456789;

    // localize
    var txt = number.toLocaleString.apply(number, that.localeData);

    // find sentinels
    var localThousandsSepIndex1 = txt.indexOf('1');
    var localThousandsSepIndex2 = txt.indexOf('2');
    var localDecimalSepIndex1 = txt.indexOf('4');
    var localDecimalSepIndex2 = txt.indexOf('5');

    // get the separators from the localized string
    var thousandsSeparator = txt.substring(localThousandsSepIndex1 + 1, localThousandsSepIndex2);
    var decimalSeparator = txt.substring(localDecimalSepIndex1 + 1, localDecimalSepIndex2);

    // number of decimal places
    var decimalPlaces = txt.length - localDecimalSepIndex2 - 1;

    return {
      thousandsSeparator: thousandsSeparator,
      decimalSeparator: decimalSeparator,
      parseFloatDecimalSeparator: '.',
      parseFloatThousandsSeparator: '',
      decimalPlaces: decimalPlaces
    };
  }
  this.separators = getSeparators();
};

FromLocaleString.prototype._cleanNumber = function(txt) {
  "use strict";

  var clean = txt;

  // remove thousands-separators
  while (clean.indexOf(this.separators.thousandsSeparator) != -1) {
    clean = clean.replace(
      this.separators.thousandsSeparator,
      this.separators.parseFloatThousandsSeparator
    );
  }

  // convert decimal-separator to one that
  // parseFloat understands
  if (this.separators.decimalSeparator !== this.separators.parseFloatDecimalSeparator) {
    clean = clean.replace(
      this.separators.decimalSeparator,
      this.separators.parseFloatDecimalSeparator
    );
  }

  return clean;
};

FromLocaleString.prototype.number = function(txt) {
  "use strict";

  var clean = this._cleanNumber(txt);
  return Number(clean);
};

FromLocaleString.prototype.parseFloat = function(txt) {
  "use strict";

  var clean = this._cleanNumber(txt);
  return parseFloat(clean);
};

FromLocaleString.prototype.parseInt = function(txt, base) {
  "use strict";

  var clean = this._cleanNumber(txt);

  if (base) {
    return parseInt(clean, base);
  } else {
    return parseInt(clean);
  }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = FromLocaleString;
}
