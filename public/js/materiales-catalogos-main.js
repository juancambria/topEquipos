createHMCatalogos({
  params: {
    family: 'material_familia_id',
    brand: 'material_marca_id',
  },
  pages: {
    familias: {
      pageId: 'materialesFamiliasPage',
      rowSelector: '#tablaMaterialesFamilias tbody tr[data-id]',
      selectedInfoId: 'selectedMaterialFamiliaInfo',
      buttons: {
        create: 'btnMaterialFamiliaCrear',
        edit: 'btnMaterialFamiliaEditar',
        delete: 'btnMaterialFamiliaEliminar',
      },
      modal: {
        id: 'modalMaterialFamiliaCrud',
        fields: { id: 'materialFamiliaCrudId', name: 'materialFamiliaCrudNombre' },
      },
    },
    marcas: {
      pageId: 'materialesMarcasPage',
      rowSelector: '#tablaMaterialesMarcas tbody tr[data-id]',
      selectedInfoId: 'selectedMaterialMarcaInfo',
      buttons: {
        create: 'btnMaterialMarcaCrear',
        edit: 'btnMaterialMarcaEditar',
        delete: 'btnMaterialMarcaEliminar',
      },
      modal: {
        id: 'modalMaterialMarcaCrud',
        fields: { id: 'materialMarcaCrudId', family: 'materialMarcaCrudFamilia', name: 'materialMarcaCrudNombre' },
        buttons: { quickFamily: 'btnMaterialMarcaNuevaFamilia' },
        quickFamilyIds: { modalId: 'modalMaterialQuickFamilia', inputId: 'materialQuickFamiliaNombre' },
      },
    },
    modelos: {
      pageId: 'materialesModelosPage',
      rowSelector: '#tablaMaterialesModelos tbody tr[data-id]',
      selectedInfoId: 'selectedMaterialModeloInfo',
      buttons: {
        create: 'btnMaterialModeloCrear',
        edit: 'btnMaterialModeloEditar',
        delete: 'btnMaterialModeloEliminar',
      },
      modal: {
        id: 'modalMaterialModeloCrud',
        fields: {
          id: 'materialModeloCrudId',
          family: 'materialModeloCrudFamilia',
          brand: 'materialModeloCrudMarca',
          name: 'materialModeloCrudNombre',
        },
        buttons: {
          quickFamily: 'btnMaterialModeloNuevaFamilia',
          quickBrand: 'btnMaterialModeloNuevaMarca',
        },
        quickFamilyIds: { modalId: 'modalMaterialQuickFamilia', inputId: 'materialQuickFamiliaNombre' },
        quickBrandIds: { modalId: 'modalMaterialQuickMarca', inputId: 'materialQuickMarcaNombre' },
      },
    },
  },
});
