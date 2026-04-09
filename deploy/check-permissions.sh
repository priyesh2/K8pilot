#!/bin/bash

NAMESPACE="k8pilot"
SA="devops-assistant-sa"

echo "--------------------------------------------------------"
echo "🔍 Checking k8pilot ServiceAccount Permissions"
echo "--------------------------------------------------------"

resources=("pods" "deployments" "namespaces" "events")
actions=("list" "get" "patch")
check_ns=("k8pilot" "default" "backend" "istio-system")

for res in "${resources[@]}"; do
  for act in "${actions[@]}"; do
    echo -n "Can $SA $act $res --all-namespaces? "
    kubectl auth can-i $act $res --as=system:serviceaccount:$NAMESPACE:$SA --all-namespaces
  done
done

echo "--------------------------------------------------------"
echo "🔍 Specific Namespace Checks (backend)"
echo "--------------------------------------------------------"
for res in "${resources[@]}"; do
  echo -n "Can $SA list $res in namespace 'backend'? "
  kubectl auth can-i list $res -n backend --as=system:serviceaccount:$NAMESPACE:$SA
done

echo "--------------------------------------------------------"
echo "✅ Complete. If you see 'no', run: kubectl apply -f deploy/rbac.yaml"
echo "--------------------------------------------------------"
