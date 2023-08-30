
/*
    jQuery Masked Input Plugin
    Copyright (c) 2007 - 2015 Josh Bush (digitalbush.com)
    Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
    Version: 1.4.1
*/
!function (factory) {
  "function" == typeof define && define.amd ? define(["jquery"], factory) : factory("object" == typeof exports ? require("jquery") : jQuery);
}(function ($) {
  var caretTimeoutId, ua = navigator.userAgent, iPhone = /iphone/i.test(ua), chrome = /chrome/i.test(ua), android = /android/i.test(ua);
  $.mask = {
    definitions: {
      "9": "[0-9]",
      a: "[A-Za-z]",
      "*": "[A-Za-z0-9]"
    },
    autoclear: !0,
    dataName: "rawMaskFn",
    placeholder: "_"
  }, $.fn.extend({
    caret: function (begin, end) {
      var range;
      if (0 !== this.length && !this.is(":hidden")) return "number" == typeof begin ? (end = "number" == typeof end ? end : begin,
        this.each(function () {
          this.setSelectionRange ? this.setSelectionRange(begin, end) : this.createTextRange && (range = this.createTextRange(),
            range.collapse(!0), range.moveEnd("character", end), range.moveStart("character", begin),
            range.select());
        })) : (this[0].setSelectionRange ? (begin = this[0].selectionStart, end = this[0].selectionEnd) : document.selection && document.selection.createRange && (range = document.selection.createRange(),
          begin = 0 - range.duplicate().moveStart("character", -1e5), end = begin + range.text.length),
        {
          begin: begin,
          end: end
        });
    },
    unmask: function () {
      return this.trigger("unmask");
    },
    mask: function (mask, settings) {
      var input, defs, tests, partialPosition, firstNonMaskPos, lastRequiredNonMaskPos, len, oldVal;
      if (!mask && this.length > 0) {
        input = $(this[0]);
        var fn = input.data($.mask.dataName);
        return fn ? fn() : void 0;
      }
      return settings = $.extend({
        autoclear: $.mask.autoclear,
        placeholder: $.mask.placeholder,
        completed: null
      }, settings), defs = $.mask.definitions, tests = [], partialPosition = len = mask.length,
        firstNonMaskPos = null, $.each(mask.split(""), function (i, c) {
          "?" == c ? (len--, partialPosition = i) : defs[c] ? (tests.push(new RegExp(defs[c])),
            null === firstNonMaskPos && (firstNonMaskPos = tests.length - 1), partialPosition > i && (lastRequiredNonMaskPos = tests.length - 1)) : tests.push(null);
        }), this.trigger("unmask").each(function () {
          function tryFireCompleted() {
            if (settings.completed) {
              for (var i = firstNonMaskPos; lastRequiredNonMaskPos >= i; i++) if (tests[i] && buffer[i] === getPlaceholder(i)) return;
              settings.completed.call(input);
            }
          }
          function getPlaceholder(i) {
            return settings.placeholder.charAt(i < settings.placeholder.length ? i : 0);
          }
          function seekNext(pos) {
            for (; ++pos < len && !tests[pos];);
            return pos;
          }
          function seekPrev(pos) {
            for (; --pos >= 0 && !tests[pos];);
            return pos;
          }
          function shiftL(begin, end) {
            var i, j;
            if (!(0 > begin)) {
              for (i = begin, j = seekNext(end); len > i; i++) if (tests[i]) {
                if (!(len > j && tests[i].test(buffer[j]))) break;
                buffer[i] = buffer[j], buffer[j] = getPlaceholder(j), j = seekNext(j);
              }
              writeBuffer(), input.caret(Math.max(firstNonMaskPos, begin));
            }
          }
          function shiftR(pos) {
            var i, c, j, t;
            for (i = pos, c = getPlaceholder(pos); len > i; i++) if (tests[i]) {
              if (j = seekNext(i), t = buffer[i], buffer[i] = c, !(len > j && tests[j].test(t))) break;
              c = t;
            }
          }
          function androidInputEvent() {
            var curVal = input.val(), pos = input.caret();
            if (oldVal && oldVal.length && oldVal.length > curVal.length) {
              for (checkVal(!0); pos.begin > 0 && !tests[pos.begin - 1];) pos.begin--;
              if (0 === pos.begin) for (; pos.begin < firstNonMaskPos && !tests[pos.begin];) pos.begin++;
              input.caret(pos.begin, pos.begin);
            } else {
              for (checkVal(!0); pos.begin < len && !tests[pos.begin];) pos.begin++;
              input.caret(pos.begin, pos.begin);
            }
            tryFireCompleted();
          }
          function blurEvent() {
            checkVal(), input.val() != focusText && input.change();
          }
          function keydownEvent(e) {
            if (!input.prop("readonly")) {
              var pos, begin, end, k = e.which || e.keyCode;
              oldVal = input.val(), 8 === k || 46 === k || iPhone && 127 === k ? (pos = input.caret(),
                begin = pos.begin, end = pos.end, end - begin === 0 && (begin = 46 !== k ? seekPrev(begin) : end = seekNext(begin - 1),
                  end = 46 === k ? seekNext(end) : end), clearBuffer(begin, end), shiftL(begin, end - 1),
                e.preventDefault()) : 13 === k ? blurEvent.call(this, e) : 27 === k && (input.val(focusText),
                  input.caret(0, checkVal()), e.preventDefault());
            }
          }
          function keypressEvent(e) {
            if (!input.prop("readonly")) {
              var p, c, next, k = e.which || e.keyCode, pos = input.caret();
              if (!(e.ctrlKey || e.altKey || e.metaKey || 32 > k) && k && 13 !== k) {
                if (pos.end - pos.begin !== 0 && (clearBuffer(pos.begin, pos.end), shiftL(pos.begin, pos.end - 1)),
                  p = seekNext(pos.begin - 1), len > p && (c = String.fromCharCode(k), tests[p].test(c))) {
                  if (shiftR(p), buffer[p] = c, writeBuffer(), next = seekNext(p), android) {
                    var proxy = function () {
                      $.proxy($.fn.caret, input, next)();
                    };
                    setTimeout(proxy, 0);
                  } else input.caret(next);
                  pos.begin <= lastRequiredNonMaskPos && tryFireCompleted();
                }
                e.preventDefault();
              }
            }
          }
          function clearBuffer(start, end) {
            var i;
            for (i = start; end > i && len > i; i++) tests[i] && (buffer[i] = getPlaceholder(i));
          }
          function writeBuffer() {
            input.val(buffer.join(""));
          }
          function checkVal(allow) {
            var i, c, pos, test = input.val(), lastMatch = -1;
            for (i = 0, pos = 0; len > i; i++) if (tests[i]) {
              for (buffer[i] = getPlaceholder(i); pos++ < test.length;) if (c = test.charAt(pos - 1),
                tests[i].test(c)) {
                buffer[i] = c, lastMatch = i;
                break;
              }
              if (pos > test.length) {
                clearBuffer(i + 1, len);
                break;
              }
            } else buffer[i] === test.charAt(pos) && pos++, partialPosition > i && (lastMatch = i);
            return allow ? writeBuffer() : partialPosition > lastMatch + 1 ? settings.autoclear || buffer.join("") === defaultBuffer ? (input.val() && input.val(""),
              clearBuffer(0, len)) : writeBuffer() : (writeBuffer(), input.val(input.val().substring(0, lastMatch + 1))),
              partialPosition ? i : firstNonMaskPos;
          }
          var input = $(this), buffer = $.map(mask.split(""), function (c, i) {
            return "?" != c ? defs[c] ? getPlaceholder(i) : c : void 0;
          }), defaultBuffer = buffer.join(""), focusText = input.val();
          input.data($.mask.dataName, function () {
            return $.map(buffer, function (c, i) {
              return tests[i] && c != getPlaceholder(i) ? c : null;
            }).join("");
          }), input.one("unmask", function () {
            input.off(".mask").removeData($.mask.dataName);
          }).on("focus.mask", function () {
            if (!input.prop("readonly")) {
              clearTimeout(caretTimeoutId);
              var pos;
              focusText = input.val(), pos = checkVal(), caretTimeoutId = setTimeout(function () {
                input.get(0) === document.activeElement && (writeBuffer(), pos == mask.replace("?", "").length ? input.caret(0, pos) : input.caret(pos));
              }, 10);
            }
          }).on("blur.mask", blurEvent).on("keydown.mask", keydownEvent).on("keypress.mask", keypressEvent).on("input.mask paste.mask", function () {
            input.prop("readonly") || setTimeout(function () {
              var pos = checkVal(!0);
              input.caret(pos), tryFireCompleted();
            }, 0);
          }), chrome && android && input.off("input.mask").on("input.mask", androidInputEvent),
            checkVal();
        });
    }
  });
});

// =====================================================================================================================================================
// Добавление отступа при фиксированной шапке
if (document.querySelector("._js_top_padding")) {
  const hero = document.querySelector('._js_top_padding');
  const header = document.querySelector('#header');
  hero.style.paddingTop = `${header.offsetHeight}px`;

  $(window).resize(function () {
    hero.style.paddingTop = `${header.offsetHeight}px`;

  });
}
if (document.querySelector(".products__r")) {
  const hero = document.querySelector('.products__r');
  const header = document.querySelector('#header');
  hero.style.top = `${header.offsetHeight}px`;

  $(window).resize(function () {
    hero.style.top = `${header.offsetHeight}px`;

  });
}


document.addEventListener('DOMContentLoaded', function () {

  $(function () {
    let body = $('body');
    let header = $('.header');
    body.addClass('loaded');

    $(window).scroll(function () {
      if ($(this).scrollTop() > 1) {
        header.addClass('header_fixed');
      } else {
        header.removeClass('header_fixed');
      }
    });
  })

  // ===============================================



  $('.icon-menu').click(function (e) {
    $('html').toggleClass('_open');
    // console.log(this)
  });

  $('.menu__mobile--clouse').click(function (e) {
    $('html').removeClass('_open');
  });

  $(window).resize(function () {
    if (window.screen.width > 992) {
      $('html').removeClass('_open');
    }
  });

  $('.menu-item').click(function (e) {
    $('html').removeClass('_open');
  });

  // ===============================================

  if (document.querySelector("._cart_sl")) {
    $("._cart_sl").slick({
      infinite: true,
      speed: 500,
      slidesToShow: 6,
      slidesToScroll: 1
    });
  }


  // ===============================================

  // Catalog Slider
  if (document.querySelector(".cart__sl")) {
    $('.cart__sl').each(function (index, element) {
      var $this = $(this);
      $this.addClass("instance-" + index);
      $(".instance-" + index).slick({
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        dots: true,
      });

    });
  }


  // ===============================================

  $(".fliter__item__title").on("click", function () {
    $(this).next('.fliter__item__row').slideToggle("fast");
  });

  $('._js_link').click(function (e) {
    $('.fliter__inner').toggleClass('_open');
    // console.log(this)
  });
  $('._js_clous').click(function (e) {
    $('.fliter__inner').removeClass('_open');
    // console.log(this)
  });

  // ===============================================


  if (document.querySelector("#new-profile")) {
    $("#new-profile .btn-black").on("click", function () {
      $('.profile_empty').removeClass("profile_empty");
      $('.profile__orders__empty').remove();
    });
  }

  if (document.querySelector(".form__return__itog")) {
    $("._js_open_itog").on("click", function () {
      $(".form__return__itog").addClass("_open");
    });
  }

  // ===============================================

  $('._js_click').click(function (e) {
    e.preventDefault();
    $('.costum_popap').addClass('_open');
    setInterval(function () {
      $('.costum_popap').removeClass('_open');
    }, 4000);

  });


  // ===============================================
  // маска c блокировкой первой цифры 8:

  $.mask.definitions['h'] = "[0|1|3|4|5|6|7|9]"
  $('.input_phone').mask("+7 (h99) 999-99-99");

  // $('.input_phone').inputmask({ "mask": "+7 (h99) 999-99-99" });
  $('.input_email').inputmask("email");
  $(".input_date").inputmask("99.99.9999", { "placeholder": "дд.мм.гггг" });

  // ===============================================

  // СВАЙП МЫШКОЙ ГОРИЗОНТАЛЬНОГО СКРОЛЛА -------------------
  var $slider = $('.collection__inner');
  var isDown = false;
  var startX;
  var scrollLeft;

  $slider.mousedown(function (e) {
    isDown = true;
    $slider.addClass('active');
    startX = e.pageX - $slider.get(0).offsetLeft;
    scrollLeft = $slider.get(0).scrollLeft;
  });
  $slider.mouseleave(function () {
    isDown = false;
    $slider.removeClass('active');
  });
  $slider.mouseup(function () {
    isDown = false;
    $slider.removeClass('active');
  });
  $slider.mousemove(function (e) {
    if (!isDown) return;
    e.preventDefault();
    var x = e.pageX - $slider.get(0).offsetLeft;
    var walk = (x - startX) * 2; //scroll-fast
    $slider.get(0).scrollLeft = scrollLeft - walk;
    // console.log(walk);
  });
  // СВАЙП МЫШКОЙ ГОРИЗОНТАЛЬНОГО СКРОЛЛА -------------------


  // ===============================================

});

$('[data-fancybox]').fancybox({
  //   touch: false,
});







// Dynamic Adapt v.1
// HTML data-da="where(uniq class name),when(breakpoint),position(digi)"
// e.x. data-da=".item,992,2"
// Andrikanych Yevhen 2020
// https://www.youtube.com/c/freelancerlifestyle

"use strict";

function DynamicAdapt(type) {
  this.type = type;
}

DynamicAdapt.prototype.init = function () {
  const _this = this;
  // массив объектов
  this.оbjects = [];
  this.daClassname = "_dynamic_adapt_";
  // массив DOM-элементов
  this.nodes = document.querySelectorAll("[data-da]");

  // наполнение оbjects объктами
  for (let i = 0; i < this.nodes.length; i++) {
    const node = this.nodes[i];
    const data = node.dataset.da.trim();
    const dataArray = data.split(",");
    const оbject = {};
    оbject.element = node;
    оbject.parent = node.parentNode;
    оbject.destination = document.querySelector(dataArray[0].trim());
    оbject.breakpoint = dataArray[1] ? dataArray[1].trim() : "767";
    оbject.place = dataArray[2] ? dataArray[2].trim() : "last";
    оbject.index = this.indexInParent(оbject.parent, оbject.element);
    this.оbjects.push(оbject);
  }

  this.arraySort(this.оbjects);

  // массив уникальных медиа-запросов
  this.mediaQueries = Array.prototype.map.call(this.оbjects, function (item) {
    return '(' + this.type + "-width: " + item.breakpoint + "px)," + item.breakpoint;
  }, this);
  this.mediaQueries = Array.prototype.filter.call(this.mediaQueries, function (item, index, self) {
    return Array.prototype.indexOf.call(self, item) === index;
  });

  // навешивание слушателя на медиа-запрос
  // и вызов обработчика при первом запуске
  for (let i = 0; i < this.mediaQueries.length; i++) {
    const media = this.mediaQueries[i];
    const mediaSplit = String.prototype.split.call(media, ',');
    const matchMedia = window.matchMedia(mediaSplit[0]);
    const mediaBreakpoint = mediaSplit[1];

    // массив объектов с подходящим брейкпоинтом
    const оbjectsFilter = Array.prototype.filter.call(this.оbjects, function (item) {
      return item.breakpoint === mediaBreakpoint;
    });
    matchMedia.addListener(function () {
      _this.mediaHandler(matchMedia, оbjectsFilter);
    });
    this.mediaHandler(matchMedia, оbjectsFilter);
  }
};

DynamicAdapt.prototype.mediaHandler = function (matchMedia, оbjects) {
  if (matchMedia.matches) {
    for (let i = 0; i < оbjects.length; i++) {
      const оbject = оbjects[i];
      оbject.index = this.indexInParent(оbject.parent, оbject.element);
      this.moveTo(оbject.place, оbject.element, оbject.destination);
    }
  } else {
    for (let i = 0; i < оbjects.length; i++) {
      const оbject = оbjects[i];
      if (оbject.element.classList.contains(this.daClassname)) {
        this.moveBack(оbject.parent, оbject.element, оbject.index);
      }
    }
  }
};

// Функция перемещения
DynamicAdapt.prototype.moveTo = function (place, element, destination) {
  element.classList.add(this.daClassname);
  if (place === 'last' || place >= destination.children.length) {
    destination.insertAdjacentElement('beforeend', element);
    return;
  }
  if (place === 'first') {
    destination.insertAdjacentElement('afterbegin', element);
    return;
  }
  destination.children[place].insertAdjacentElement('beforebegin', element);
}

// Функция возврата
DynamicAdapt.prototype.moveBack = function (parent, element, index) {
  element.classList.remove(this.daClassname);
  if (parent.children[index] !== undefined) {
    parent.children[index].insertAdjacentElement('beforebegin', element);
  } else {
    parent.insertAdjacentElement('beforeend', element);
  }
}

// Функция получения индекса внутри родителя
DynamicAdapt.prototype.indexInParent = function (parent, element) {
  const array = Array.prototype.slice.call(parent.children);
  return Array.prototype.indexOf.call(array, element);
};

// Функция сортировки массива по breakpoint и place 
// по возрастанию для this.type = min
// по убыванию для this.type = max
DynamicAdapt.prototype.arraySort = function (arr) {
  if (this.type === "min") {
    Array.prototype.sort.call(arr, function (a, b) {
      if (a.breakpoint === b.breakpoint) {
        if (a.place === b.place) {
          return 0;
        }

        if (a.place === "first" || b.place === "last") {
          return -1;
        }

        if (a.place === "last" || b.place === "first") {
          return 1;
        }

        return a.place - b.place;
      }

      return a.breakpoint - b.breakpoint;
    });
  } else {
    Array.prototype.sort.call(arr, function (a, b) {
      if (a.breakpoint === b.breakpoint) {
        if (a.place === b.place) {
          return 0;
        }

        if (a.place === "first" || b.place === "last") {
          return 1;
        }

        if (a.place === "last" || b.place === "first") {
          return -1;
        }

        return b.place - a.place;
      }

      return b.breakpoint - a.breakpoint;
    });
    return;
  }
};

const da = new DynamicAdapt("max");
da.init();




