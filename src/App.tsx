import { useState, useEffect } from 'react';
import SkylightSelector from '@/components/SkylightSelector';

function App() {
  const [customerMapping, setCustomerMapping] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  // Read customer ID from URL path (e.g., skylightselector.co.nz/bunnings)
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const customerId = pathParts.length > 0 ? pathParts[0].toLowerCase() : 'velux';

  useEffect(() => {
    const loadConfig = async () => {
      if (customerId && customerId !== 'velux') {
        try {
          // @ts-expect-error - Dynamic import for customer mapping
          const mapping = await import(`./data/${customerId}-mapping.json`);
          setCustomerMapping(mapping.default || mapping);
        } catch (e) {
          console.warn(`No specific config found for customer: ${customerId}`);
          setCustomerMapping(null);
        }
      } else {
        setCustomerMapping(null);
      }
      setLoading(false);
    };
    loadConfig();
  }, [customerId]);

  if (loading) {
     return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <SkylightSelector customerId={customerId} customerMapping={customerMapping} />
    </div>
  );
}

export default App;
