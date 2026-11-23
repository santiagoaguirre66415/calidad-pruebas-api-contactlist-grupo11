import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Runner principal. Ejecuta todos los .feature (excepto helpers marcados @ignore).
 * Reporte HTML: target/karate-reports/karate-summary.html
 */
class ContactListTest {

    @Test
    void ejecutarTodasLasPruebas() {
        Results results = Runner.path("classpath:features")
                .tags("~@ignore")
                .outputCucumberJson(true)
                .parallel(1); // secuencial: evita saturar la API publica
        assertEquals(0, results.getFailCount(), results.getErrorMessages());
    }
}
