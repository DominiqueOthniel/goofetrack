import { useMemo, useState } from 'react';
import { useApp, Personnel as PersonnelRecord, PersonnelStatus, PersonnelType } from '@/contexts/AppContext';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { BriefcaseBusiness, Edit, Loader2, Plus, Search, Trash2, UserRoundCheck, Users } from 'lucide-react';
import { toast } from 'sonner';

const defaultForm = {
  nom: '',
  prenom: '',
  telephone: '',
  email: '',
  type: 'employe' as PersonnelType,
  poste: '',
  statut: 'actif' as PersonnelStatus,
  salaireMensuel: undefined as number | undefined,
  dateEmbauche: '',
  notes: '',
};

const typeLabel: Record<PersonnelType, string> = {
  employe: 'Employé',
  stagiaire: 'Stagiaire',
};

const statusLabel: Record<PersonnelStatus, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
};

export default function Personnel() {
  const { personnel, expenses, createPersonnel, updatePersonnel, deletePersonnel } = useApp();
  const { canManageFleet } = useAuth();
  const { isSubmitting, withGuard } = useSubmitGuard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<PersonnelRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | PersonnelType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | PersonnelStatus>('all');
  const [formData, setFormData] = useState(defaultForm);

  const salaryTotalByPersonnel = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      if (expense.personnelId && expense.categorie === 'Salaire') {
        acc[expense.personnelId] = (acc[expense.personnelId] || 0) + expense.montant;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);

  const totalSalaryExpenses = Object.values(salaryTotalByPersonnel).reduce((sum, amount) => sum + amount, 0);

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingPersonnel(null);
  };

  const handleEdit = (item: PersonnelRecord) => {
    setEditingPersonnel(item);
    setFormData({
      nom: item.nom,
      prenom: item.prenom,
      telephone: item.telephone || '',
      email: item.email || '',
      type: item.type,
      poste: item.poste || '',
      statut: item.statut,
      salaireMensuel: item.salaireMensuel,
      dateEmbauche: item.dateEmbauche || '',
      notes: item.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await withGuard(async () => {
      const payload = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        telephone: formData.telephone.trim() || undefined,
        email: formData.email.trim() || undefined,
        type: formData.type,
        poste: formData.poste.trim() || undefined,
        statut: formData.statut,
        salaireMensuel: formData.salaireMensuel,
        dateEmbauche: formData.dateEmbauche || undefined,
        notes: formData.notes.trim() || undefined,
      };

      try {
        if (editingPersonnel) {
          await updatePersonnel(editingPersonnel.id, payload);
          toast.success('Personnel modifié');
        } else {
          await createPersonnel(payload);
          toast.success('Personnel ajouté');
        }
        setIsDialogOpen(false);
        resetForm();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      }
    });
  };

  const handleDelete = async (item: PersonnelRecord) => {
    const salaryExpensesCount = expenses.filter((expense) => expense.personnelId === item.id).length;
    if (salaryExpensesCount > 0) {
      toast.error('Impossible de supprimer ce personnel : des dépenses lui sont rattachées.');
      return;
    }

    if (!confirm(`Supprimer ${item.prenom} ${item.nom} ?`)) return;
    try {
      await deletePersonnel(item.id);
      toast.success('Personnel supprimé');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const filteredPersonnel = personnel.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.statut !== filterStatus) return false;
    if (!searchTerm.trim()) return true;

    const search = searchTerm.toLowerCase();
    return [
      item.nom,
      item.prenom,
      item.telephone,
      item.email,
      item.poste,
      item.notes,
      typeLabel[item.type],
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  const activeCount = personnel.filter((item) => item.statut === 'actif').length;
  const traineesCount = personnel.filter((item) => item.type === 'stagiaire').length;

  return (
    <div className="space-y-6 p-1">
      <PageHeader
        title="Gestion du Personnel"
        description="Ajoutez vos employés et stagiaires, puis rattachez les dépenses de salaire à chaque personne."
        icon={Users}
        gradient="from-indigo-500/20 via-sky-500/10 to-transparent"
        stats={[
          {
            label: 'Personnel',
            value: personnel.length,
            icon: <Users className="h-4 w-4" />,
            color: 'text-indigo-600 dark:text-indigo-400',
          },
          {
            label: 'Actifs',
            value: activeCount,
            icon: <UserRoundCheck className="h-4 w-4" />,
            color: 'text-green-600 dark:text-green-400',
          },
          {
            label: 'Stagiaires',
            value: traineesCount,
            icon: <BriefcaseBusiness className="h-4 w-4" />,
            color: 'text-sky-600 dark:text-sky-400',
          },
          {
            label: 'Dépenses salariales',
            value: `${totalSalaryExpenses.toLocaleString('fr-FR')} FCFA`,
            icon: <BriefcaseBusiness className="h-4 w-4" />,
            color: 'text-red-600 dark:text-red-400',
          },
        ]}
        actions={
          canManageFleet ? (
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un personnel
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPersonnel ? 'Modifier' : 'Ajouter'} un personnel</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prenom">Prénom</Label>
                      <Input
                        id="prenom"
                        value={formData.prenom}
                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nom">Nom</Label>
                      <Input
                        id="nom"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value as PersonnelType })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employe">Employé</SelectItem>
                          <SelectItem value="stagiaire">Stagiaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="statut">Statut</Label>
                      <Select
                        value={formData.statut}
                        onValueChange={(value) => setFormData({ ...formData, statut: value as PersonnelStatus })}
                      >
                        <SelectTrigger id="statut">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actif">Actif</SelectItem>
                          <SelectItem value="inactif">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="poste">Poste</Label>
                      <Input
                        id="poste"
                        value={formData.poste}
                        onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                        placeholder="Ex: Assistant comptable"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salaireMensuel">Salaire mensuel (FCFA)</Label>
                      <NumberInput
                        id="salaireMensuel"
                        min={0}
                        value={formData.salaireMensuel}
                        onChange={(value) => setFormData({ ...formData, salaireMensuel: value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="telephone">Téléphone</Label>
                      <Input
                        id="telephone"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateEmbauche">Date d’entrée</Label>
                      <Input
                        id="dateEmbauche"
                        type="date"
                        value={formData.dateEmbauche}
                        onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Contrat, remarques..."
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : editingPersonnel ? (
                      'Modifier'
                    ) : (
                      'Ajouter'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search-personnel">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-personnel"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, poste, téléphone..."
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as 'all' | PersonnelType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="employe">Employés</SelectItem>
                <SelectItem value="stagiaire">Stagiaires</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Statut</Label>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | PersonnelStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="actif">Actifs</SelectItem>
                <SelectItem value="inactif">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste du personnel</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Salaire mensuel</TableHead>
                  <TableHead className="text-right">Dépenses salariales</TableHead>
                  <TableHead>Date d’entrée</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersonnel.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.prenom} {item.nom}</div>
                      {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'employe' ? 'default' : 'secondary'}>
                        {typeLabel[item.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.poste || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">{item.telephone || '-'}</div>
                      {item.email && <div className="text-xs text-muted-foreground">{item.email}</div>}
                    </TableCell>
                    <TableCell>{statusLabel[item.statut]}</TableCell>
                    <TableCell className="text-right">
                      {item.salaireMensuel ? `${item.salaireMensuel.toLocaleString('fr-FR')} FCFA` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {(salaryTotalByPersonnel[item.id] || 0).toLocaleString('fr-FR')} FCFA
                    </TableCell>
                    <TableCell>
                      {item.dateEmbauche ? new Date(item.dateEmbauche).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageFleet && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPersonnel.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Aucun personnel trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
