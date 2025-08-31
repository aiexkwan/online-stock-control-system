#!/bin/bash

# Batch fix unused variables by adding underscore prefix
files=(
  "lib/graphql/dataloaders/complex.dataloader.ts"
  "lib/graphql/resolvers/report.resolver.ts"
  "lib/hooks/useOrderData.ts"
  "app/actions/DownloadCentre-Actions.ts"
  "lib/graphql/resolvers/stats.resolver.ts"
  "lib/cache/redis-cache-adapter.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Fix unused variables in assignments
    perl -i -pe 's/const ([a-zA-Z][a-zA-Z0-9]*) = /const _$1 = /g unless /const _/' "$file"
    
    # Fix unused function parameters  
    perl -i -pe 's/\(([a-zA-Z][a-zA-Z0-9]*):/(\_$1:/g unless /\(_/' "$file"
    
    # Fix array index parameters
    perl -i -pe 's/, ([a-zA-Z][a-zA-Z0-9]*)\)/, _$1)/g unless /, _/' "$file"
    
    echo "Fixed $file"
  else
    echo "File not found: $file"
  fi
done

echo "Batch fix completed"
