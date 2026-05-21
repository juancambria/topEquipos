createHMCatalogos({
  params: {
    family: 'herramienta_familia_id',
    brand: 'herramienta_marca_id',
  },
  pages: {
    familias: {
      pageId: 'herramientasFamiliasPage',
      rowSelector: '#tablaHerramientasFamilias tbody tr[data-id]',
      selectedInfoId: 'selectedHerramientaFamiliaInfo',
      buttons: {
        create: 'btnHerramientaFamiliaCrear',
        edit: 'btnHerramientaFamiliaEditar',
        delete: 'btnHerramientaFamiliaEliminar',
      },
      modal: {
        id: 'modalHerramientaFamiliaCrud',
        fields: { id: 'herramientaFamiliaCrudId', name: 'herramientaFamiliaCrudNombre' },
      },
    },
    marcas: {
      pageId: 'herramientasMarcasPage',
      rowSelector: '#tablaHerramientasMarcas tbody tr[data-id]',
      selectedInfoId: 'selectedHerramientaMarcaInfo',
      buttons: {
        create: 'btnHerramientaMarcaCrear',
        edit: 'btnHerramientaMarcaEditar',
        delete: 'btnHerramientaMarcaEliminar',
      },
      modal: {
        id: 'modalHerramientaMarcaCrud',
        fields: { id: 'herramientaMarcaCrudId', family: 'herramientaMarcaCrudFamilia', name: 'herramientaMarcaCrudNombre' },
        buttons: { quickFamily: 'btnHerramientaMarcaNuevaFamilia' },
        quickFamilyIds: { modalId: 'modalHerramientaQuickFamilia', inputId: 'herramientaQuickFamiliaNombre' },
      },
    },
    modelos: {
      pageId: 'herramientasModelosPage',
      rowSelector: '#tablaHerramientasModelos tbody tr[data-id]',
      selectedInfoId: 'selectedHerramientaModeloInfo',
      buttons: {
        create: 'btnHerramientaModeloCrear',
        edit: 'btnHerramientaModeloEditar',
        delete: 'btnHerramientaModeloEliminar',
      },
      modal: {
        id: 'modalHerramientaModeloCrud',
        fields: {
          id: 'herramientaModeloCrudId',
          family: 'herramientaModeloCrudFamilia',
          brand: 'herramientaModeloCrudMarca',
          name: 'herramientaModeloCrudNombre',
        },
        buttons: {
          quickFamily: 'btnHerramientaModeloNuevaFamilia',
          quickBrand: 'btnHerramientaModeloNuevaMarca',
        },
        quickFamilyIds: { modalId: 'modalHerramientaQuickFamilia', inputId: 'herramientaQuickFamiliaNombre' },
        quickBrandIds: { modalId: 'modalHerramientaQuickMarca', inputId: 'herramientaQuickMarcaNombre' },
      },
    },
  },
});
