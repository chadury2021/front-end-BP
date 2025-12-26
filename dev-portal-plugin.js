// babel plugin for dev portal to inject crossOrigin to img tags

module.exports = function ({ types: t }) {
  return {
    name: 'dev-portal-plugin',
    visitor: {
      JSXOpeningElement(path) {
        if (path.node.name.name !== 'img') return;

        // inject crossOrigin for img tags
        const alreadyHasAttr = path.node.attributes.some(
          (attr) => t.isJSXAttribute(attr) && attr.name.name === 'crossOrigin'
        );
        if (!alreadyHasAttr) {
          path.node.attributes.push(t.jsxAttribute(t.jsxIdentifier('crossOrigin'), t.stringLiteral('anonymous')));
        }

        // replace navbar logo with portal logo
        const isNavBarLogo = path.node.attributes.some(
          (attr) => t.isJSXAttribute(attr) && attr.name.name === 'id' && attr.value.value === 'nav-bar-tread-logo'
        );
        if (isNavBarLogo) {
          const srcNode = path.node.attributes.find((node) => node.name.name === 'src');
          srcNode.value.expression.property.name = 'treadPortal';
          srcNode.value.expression.property.loc.identifierName = 'treadPortal';
        }
      },
    },
  };
};
