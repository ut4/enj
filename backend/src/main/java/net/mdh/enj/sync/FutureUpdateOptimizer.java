package net.mdh.enj.sync;

import java.util.ArrayList;

class FutureUpdateOptimizer implements Optimizer {
    /**
     * Korvaa, tai poistaa itemin POST- tai PUT-operaatiot, jotka yliajetaan myö-
     * hemmin jonossa (miksi lisätä tai päivittää useita kertoja turhaan, jos data
     * kuitenkin päätyy tilaan x?).
     */
    @Override
    public boolean optimize(OperationTreeNode item) {
        int updateCount = item.PUT.size();
        // itemillä ei insertiä mutta useita päivityksiä -> poimi vain viimeisin
        if (item.POST == null && updateCount > 1) {
            item.PUT.get(0).setData(item.PUT.get(updateCount - 1).getData());
            item.PUT = item.PUT.subList(0, 1);
        // itemillä insert ja päivitys -> poimi insertiksi viimeisin päivitysdata + tyhjennä muut
        } else if (item.POST != null && updateCount > 0) {
            item.POST.setData(item.PUT.get(updateCount - 1).getData());
            item.PUT = new ArrayList<>();
        }
        return false; // aina voi optimoida lisää tämän jälkeen
    }
}
