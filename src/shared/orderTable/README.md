## EditTableOrder

- This component is used to edit an existing order.
- It is called from the TableOrderConfirmationModel component.
- It is also called directly from the SharedOrderTable component.

### High level flow

```mermaid
graph TD
    A[EditTableOrder Component] --> B[Initialize State Setters]
    A --> C[Load Initial Values]
    
    B --> D{User Clicks Edit}
    
    D -->|Yes| E[Process Order Data]
    E --> F[Convert Buy/Sell to Base/Quote]
    F --> G[Load Order Template]
    
    G --> H[Update Form Fields]
    H --> I[Set Loading False]
    I --> J[Close Dialog]
    
    J -->|If not dashboard view| K[Navigate to Home]
    
    C --> L[Render Button]
    L -->|If Loading| M[Show Loading Spinner]
    L -->|If Not Loading| N[Show Edit Button]
```

### When the user clicks edit

- The order data is processed to convert buy/sell to base/quote if necessary.
- The order template is loaded.
- The form fields are updated.
- The loading state is set to false.
- The dialog is closed.

```mermaid
sequenceDiagram
    participant EditButton
    participant EditTableOrder
    participant loadOrderTemplate
    participant FormAtoms
    participant NextPage

    EditButton->>EditTableOrder: Click Edit
    EditButton->>EditTableOrder: Passes order data
    EditTableOrder->>loadOrderTemplate: Calls with setters & data
    loadOrderTemplate->>FormAtoms: Updates multiple atoms
    Note over FormAtoms: Updates include:<br/>- side<br/>- accounts<br/>- pair<br/>- strategy<br/>- prices<br/>etc.
    FormAtoms->>NextPage: Atoms are available globally
```