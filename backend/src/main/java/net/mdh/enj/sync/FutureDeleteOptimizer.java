package net.mdh.enj.sync;

class FutureDeleteOptimizer implements Optimizer {
    /**
     * Tyhjentää OperationTreeNode:n kaikki operaatiot, jos se poistetaan myöhemmin
     * jonossa (miksi lisätä tai päivittää turhaan, jos data kuitenkin lopuksi
     * poistetaan?).
     */
    @Override
    public boolean optimize(OperationTreeNode item) {
        if (
            // resurssille suoritettu poisto ..
            item.DELETE != null &&
            // .. ja se on myös luotu offline-tilan aikana
            item.POST != null
        ) {
            item.reset();
            return true;
        }
        return false;
    }
}
