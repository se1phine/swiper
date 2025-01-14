import {
  $,
  addClass,
  removeClass,
  hasClass,
  toggleClass,
  attr,
  removeAttr,
  transform,
  transition,
  on,
  off,
  trigger,
  transitionEnd,
  outerWidth,
  outerHeight,
  styles,
  offset,
  css,
  each,
  html,
  text,
  is,
  index,
  eq,
  append,
  prepend,
  next,
  nextAll,
  prev,
  prevAll,
  parent,
  parents,
  closest,
  find,
  children,
  filter,
  remove,
} from 'dom7';

const Methods = {
  addClass,
  removeClass,
  hasClass,
  toggleClass,
  attr,
  removeAttr,
  transform,
  transition,
  on,
  off,
  trigger,
  transitionEnd,
  outerWidth,
  outerHeight,
  styles,
  offset,
  css,
  each,
  html,
  text,
  is,
  index,
  eq,
  append($node) {
    const html = $($node)[0].outerHTML;
    const node = $(html)[0];
    return append.call(this, node);
  },
  prepend($node) {
    const html = $($node)[0].outerHTML;
    const node = $(html)[0];
    return prepend.call(this, node);
  },
  next,
  nextAll,
  prev,
  prevAll,
  parent,
  parents,
  closest,
  find,
  children,
  filter,
  remove,
};

Object.keys(Methods).forEach((methodName) => {
  Object.defineProperty($.fn, methodName, { value: Methods[methodName], writable: true });
});

export default $;
